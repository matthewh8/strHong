'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db, type HydroLog, fetchSupaLogs, addSupaLog, deleteSupaLog, fetchSupaDailyTotals } from '@/lib/db';
import { getLogicalDate } from '@/lib/calculations';

// Unified local log type that can hold either a Dexie numeric id or a Supabase uuid string
export interface HydroLogLocal {
  id?: string | number;
  date: string;
  amount: number;
  timestamp: number;
}

interface HistoryEntry {
  id: string | number;
  amount: number;
}

export function useHydration(userId?: string) {
  const today = getLogicalDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [logs, setLogs] = useState<HydroLogLocal[]>([]);
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const logCache = useRef<Map<string, HydroLogLocal[]>>(new Map());

  const fetchLogs = useCallback(async (date: string) => {
    const cached = logCache.current.get(date);
    if (cached) {
      setLogs(cached);
      return;
    }
    if (userId) {
      const rows = await fetchSupaLogs(userId, date);
      const mapped = rows.map((r) => ({
        id: r.id,
        date: r.date,
        amount: Number(r.amount),
        timestamp: new Date(r.logged_at).getTime(),
      }));
      logCache.current.set(date, mapped);
      setLogs(mapped);
    } else {
      const result = await db.logs.where('date').equals(date).sortBy('timestamp');
      logCache.current.set(date, result as HydroLogLocal[]);
      setLogs(result as HydroLogLocal[]);
    }
  }, [userId]);

  useEffect(() => {
    fetchLogs(selectedDate);
  }, [selectedDate, fetchLogs]);

  const total = logs.reduce((sum, log) => sum + log.amount, 0);

  const handleIncrement = async (amount: number) => {
    const timestamp = Date.now();
    const tempId = `temp-${timestamp}`;

    // Optimistic update — instant UI
    const optimistic: HydroLogLocal = { id: tempId, date: selectedDate, amount, timestamp };
    const withOptimistic = [...logs, optimistic];
    setLogs(withOptimistic);
    logCache.current.set(selectedDate, withOptimistic);
    setHistoryStack((prev) => [...prev, { id: tempId, amount }]);
    setRedoStack([]);

    if (userId) {
      const row = await addSupaLog(userId, selectedDate, amount, timestamp);
      // Swap temp entry for real one with DB-assigned UUID
      setLogs((prev) => {
        const next = prev.map((l) => l.id === tempId ? { ...l, id: row.id } : l);
        logCache.current.set(selectedDate, next);
        return next;
      });
      setHistoryStack((prev) => prev.map((e) => e.id === tempId ? { ...e, id: row.id } : e));
    } else {
      const id = await db.logs.add({ date: selectedDate, amount, timestamp });
      setLogs((prev) => {
        const next = prev.map((l) => l.id === tempId ? { ...l, id: id as number } : l);
        logCache.current.set(selectedDate, next);
        return next;
      });
      setHistoryStack((prev) => prev.map((e) => e.id === tempId ? { ...e, id: id as number } : e));
    }
  };

  const handleUndo = async () => {
    if (historyStack.length === 0) return;
    const last = historyStack[historyStack.length - 1];
    // Optimistic update — remove from UI immediately
    setLogs((prev) => {
      const next = prev.filter((l) => l.id !== last.id);
      logCache.current.set(selectedDate, next);
      return next;
    });
    setHistoryStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
    if (userId) {
      await deleteSupaLog(last.id as string);
    } else {
      await db.logs.delete(last.id as number);
    }
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    const timestamp = Date.now();
    const tempId = `temp-${timestamp}`;

    // Optimistic update — add back to UI immediately
    const optimistic: HydroLogLocal = { id: tempId, date: selectedDate, amount: entry.amount, timestamp };
    setLogs((prev) => {
      const next = [...prev, optimistic];
      logCache.current.set(selectedDate, next);
      return next;
    });
    setRedoStack((prev) => prev.slice(0, -1));
    setHistoryStack((prev) => [...prev, { id: tempId, amount: entry.amount }]);

    if (userId) {
      const row = await addSupaLog(userId, selectedDate, entry.amount, timestamp);
      setLogs((prev) => {
        const next = prev.map((l) => l.id === tempId ? { ...l, id: row.id } : l);
        logCache.current.set(selectedDate, next);
        return next;
      });
      setHistoryStack((prev) => prev.map((e) => e.id === tempId ? { ...e, id: row.id } : e));
    } else {
      const newId = await db.logs.add({ date: selectedDate, amount: entry.amount, timestamp });
      setLogs((prev) => {
        const next = prev.map((l) => l.id === tempId ? { ...l, id: newId as number } : l);
        logCache.current.set(selectedDate, next);
        return next;
      });
      setHistoryStack((prev) => prev.map((e) => e.id === tempId ? { ...e, id: newId as number } : e));
    }
  };

  const handleDeleteLog = async (id: string | number) => {
    // Optimistic update — remove from UI immediately
    setLogs((prev) => {
      const next = prev.filter((l) => l.id !== id);
      logCache.current.set(selectedDate, next);
      return next;
    });
    setHistoryStack((prev) => prev.filter((e) => e.id !== id));
    if (userId) {
      await deleteSupaLog(id as string);
    } else {
      await db.logs.delete(id as number);
    }
  };

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setHistoryStack([]);
    setRedoStack([]);
  }, []);

  // Returns per-date totals for calendar dots & heatmap
  const getDailyTotals = useCallback(async (dates: string[]): Promise<Record<string, number>> => {
    if (userId) {
      return fetchSupaDailyTotals(userId, dates);
    }
    const allLogs = await db.logs.where('date').anyOf(dates).toArray();
    const totals: Record<string, number> = {};
    for (const log of allLogs) {
      totals[log.date] = (totals[log.date] ?? 0) + log.amount;
    }
    return totals;
  }, [userId]);

  return {
    today,
    selectedDate,
    logs,
    total,
    canUndo: historyStack.length > 0,
    canRedo: redoStack.length > 0,
    handleIncrement,
    handleUndo,
    handleRedo,
    handleDeleteLog,
    handleDateChange,
    getDailyTotals,
  };
}
