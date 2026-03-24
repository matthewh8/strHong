'use client';
import { useState, useEffect, useCallback } from 'react';
import { db, type HydroLog } from '@/lib/db';
import { formatDate } from '@/lib/calculations';

interface HistoryEntry {
  id: number;
  amount: number;
}

export function useHydration() {
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [logs, setLogs] = useState<HydroLog[]>([]);
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  const fetchLogs = useCallback(async (date: string) => {
    const result = await db.logs.where('date').equals(date).sortBy('timestamp');
    setLogs(result);
  }, []);

  useEffect(() => {
    fetchLogs(selectedDate);
  }, [selectedDate, fetchLogs]);

  const total = logs.reduce((sum, log) => sum + log.amount, 0);

  const handleIncrement = async (amount: number) => {
    const id = await db.logs.add({
      date: selectedDate,
      amount,
      timestamp: Date.now(),
    });
    setHistoryStack((prev) => [...prev, { id: id as number, amount }]);
    setRedoStack([]);
    await fetchLogs(selectedDate);
  };

  const handleUndo = async () => {
    if (historyStack.length === 0) return;
    const last = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
    await db.logs.delete(last.id);
    await fetchLogs(selectedDate);
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    const newId = await db.logs.add({
      date: selectedDate,
      amount: entry.amount,
      timestamp: Date.now(),
    });
    setHistoryStack((prev) => [...prev, { id: newId as number, amount: entry.amount }]);
    await fetchLogs(selectedDate);
  };

  const handleDeleteLog = async (id: number) => {
    setHistoryStack((prev) => prev.filter((e) => e.id !== id));
    await db.logs.delete(id);
    await fetchLogs(selectedDate);
  };

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setHistoryStack([]);
    setRedoStack([]);
  }, []);

  // Returns per-date totals for calendar dots & heatmap
  const getDailyTotals = useCallback(async (dates: string[]): Promise<Record<string, number>> => {
    const allLogs = await db.logs.where('date').anyOf(dates).toArray();
    const totals: Record<string, number> = {};
    for (const log of allLogs) {
      totals[log.date] = (totals[log.date] ?? 0) + log.amount;
    }
    return totals;
  }, []);

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
