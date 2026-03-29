'use client';
import { useState, useEffect, useCallback } from 'react';
import { db, type SupplementLog, fetchSupaSupplementLogs, addSupaSupplementLog, deleteSupaSupplementLog, fetchSupaDailySupplementCounts } from '@/lib/db';
import { getLogicalDate } from '@/lib/calculations';

export interface SupplementConfig {
  id: string;
  label: string;
  emoji: string;
  dose?: string;
  notes?: string;
}

const BUILTIN_SUPPLEMENTS: Record<string, Omit<SupplementConfig, 'id'>> = {
  creatine:     { label: 'Creatine',     emoji: '💪', notes: 'with water' },
  fish_oil:     { label: 'Fish Oil',     emoji: '🐟', dose: '1000mg' },
  multivitamin: { label: 'Multivitamin', emoji: '💊' },
};

const CONFIG_KEY = 'strHONG_supplement_configs';

export function getSupplementConfigs(): Record<string, SupplementConfig> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(CONFIG_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function saveSupplementConfigs(configs: Record<string, SupplementConfig>): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configs));
}

export function resolveConfig(id: string, overrides?: Partial<SupplementConfig>): SupplementConfig {
  const builtin = BUILTIN_SUPPLEMENTS[id];
  return {
    id,
    label: overrides?.label ?? builtin?.label ?? id,
    emoji: overrides?.emoji ?? builtin?.emoji ?? '💊',
    dose: overrides?.dose ?? builtin?.dose,
    notes: overrides?.notes ?? builtin?.notes,
  };
}

export function useSupplements(supplementIds: string[], userId?: string) {
  const today = getLogicalDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set());
  const [logMap, setLogMap] = useState<Record<string, number | string>>({}); // supplementId -> local log id
  const [undoQueue, setUndoQueue] = useState<Array<{ supplementId: string; logId: number | string }>>([]);

  const isCurrentDay = selectedDate === today;

  const fetchLogs = useCallback(async (date: string) => {
    if (userId) {
      const rows = await fetchSupaSupplementLogs(userId, date);
      const taken = new Set(rows.map((r) => r.supplement_id));
      const map: Record<string, string> = {};
      for (const r of rows) map[r.supplement_id] = r.id;
      setTakenIds(taken);
      setLogMap(map);
    } else {
      const rows = await db.supplementLogs.where('date').equals(date).toArray();
      const taken = new Set(rows.map((r) => r.supplement_id));
      const map: Record<string, number> = {};
      for (const r of rows) if (r.id !== undefined) map[r.supplement_id] = r.id;
      setTakenIds(taken);
      setLogMap(map);
    }
  }, [userId]);

  useEffect(() => {
    if (supplementIds.length > 0) {
      fetchLogs(selectedDate);
    }
  }, [selectedDate, fetchLogs, supplementIds.length]);

  const toggleTaken = async (supplementId: string) => {
    const alreadyTaken = takenIds.has(supplementId);

    if (alreadyTaken) {
      // Mark un-taken: remove the log
      const logId = logMap[supplementId];
      setTakenIds((prev) => { const n = new Set(prev); n.delete(supplementId); return n; });
      setLogMap((prev) => { const n = { ...prev }; delete n[supplementId]; return n; });
      setUndoQueue((prev) => prev.filter((e) => e.supplementId !== supplementId));

      if (userId) {
        await deleteSupaSupplementLog(logId as string);
      } else {
        await db.supplementLogs.delete(logId as number);
      }
    } else {
      // Mark taken: add a log
      const tempId = `temp-${Date.now()}`;
      setTakenIds((prev) => new Set([...prev, supplementId]));
      setLogMap((prev) => ({ ...prev, [supplementId]: tempId }));
      setUndoQueue((prev) => [...prev, { supplementId, logId: tempId }]);

      if (userId) {
        const row = await addSupaSupplementLog(userId, supplementId, selectedDate);
        if (row) {
          setLogMap((prev) => ({ ...prev, [supplementId]: row.id }));
          setUndoQueue((prev) => prev.map((e) => e.supplementId === supplementId ? { ...e, logId: row.id } : e));
        } else {
          // Insert failed — revert optimistic update
          setTakenIds((prev) => { const n = new Set(prev); n.delete(supplementId); return n; });
          setLogMap((prev) => { const n = { ...prev }; delete n[supplementId]; return n; });
          setUndoQueue((prev) => prev.filter((e) => e.supplementId !== supplementId));
        }
      } else {
        const id = await db.supplementLogs.add({
          supplement_id: supplementId,
          date: selectedDate,
          taken_at: new Date().toISOString(),
        });
        setLogMap((prev) => ({ ...prev, [supplementId]: id as number }));
        setUndoQueue((prev) => prev.map((e) => e.supplementId === supplementId ? { ...e, logId: id as number } : e));
      }
    }
  };

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setUndoQueue([]);
  }, []);

  // Returns per-date count of supplements taken (for calendar dots)
  const getDailyTakenCounts = useCallback(async (dates: string[]): Promise<Record<string, number>> => {
    if (dates.length === 0) return {};
    if (userId) {
      return fetchSupaDailySupplementCounts(userId, dates);
    }
    const allLogs = await db.supplementLogs.where('date').anyOf(dates).toArray();
    const counts: Record<string, number> = {};
    for (const log of allLogs) {
      counts[log.date] = (counts[log.date] ?? 0) + 1;
    }
    return counts;
  }, [userId]);

  return {
    today,
    selectedDate,
    isCurrentDay,
    takenIds,
    toggleTaken,
    handleDateChange,
    getDailyTakenCounts,
  };
}
