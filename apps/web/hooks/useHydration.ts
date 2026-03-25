'use client';
import { useState, useEffect, useCallback } from 'react';
import { db, type HydroLog, fetchSupaLogs, addSupaLog, deleteSupaLog, fetchSupaDailyTotals } from '@/lib/db';
import { formatDate } from '@/lib/calculations';

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
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [logs, setLogs] = useState<HydroLogLocal[]>([]);
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  const fetchLogs = useCallback(async (date: string) => {
    if (userId) {
      const rows = await fetchSupaLogs(userId, date);
      setLogs(
        rows.map((r) => ({
          id: r.id,
          date: r.date,
          amount: Number(r.amount),
          timestamp: new Date(r.logged_at).getTime(),
        }))
      );
    } else {
      const result = await db.logs.where('date').equals(date).sortBy('timestamp');
      setLogs(result as HydroLogLocal[]);
    }
  }, [userId]);

  useEffect(() => {
    fetchLogs(selectedDate);
  }, [selectedDate, fetchLogs]);

  const total = logs.reduce((sum, log) => sum + log.amount, 0);

  const handleIncrement = async (amount: number) => {
    const timestamp = Date.now();
    if (userId) {
      const row = await addSupaLog(userId, selectedDate, amount, timestamp);
      setHistoryStack((prev) => [...prev, { id: row.id, amount }]);
    } else {
      const id = await db.logs.add({ date: selectedDate, amount, timestamp });
      setHistoryStack((prev) => [...prev, { id: id as number, amount }]);
    }
    setRedoStack([]);
    await fetchLogs(selectedDate);
  };

  const handleUndo = async () => {
    if (historyStack.length === 0) return;
    const last = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
    if (userId) {
      await deleteSupaLog(last.id as string);
    } else {
      await db.logs.delete(last.id as number);
    }
    await fetchLogs(selectedDate);
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    const timestamp = Date.now();
    if (userId) {
      const row = await addSupaLog(userId, selectedDate, entry.amount, timestamp);
      setHistoryStack((prev) => [...prev, { id: row.id, amount: entry.amount }]);
    } else {
      const newId = await db.logs.add({ date: selectedDate, amount: entry.amount, timestamp });
      setHistoryStack((prev) => [...prev, { id: newId as number, amount: entry.amount }]);
    }
    await fetchLogs(selectedDate);
  };

  const handleDeleteLog = async (id: string | number) => {
    setHistoryStack((prev) => prev.filter((e) => e.id !== id));
    if (userId) {
      await deleteSupaLog(id as string);
    } else {
      await db.logs.delete(id as number);
    }
    await fetchLogs(selectedDate);
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
