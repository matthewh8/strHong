import Dexie, { type Table } from 'dexie';
import { supabase } from './supabase';

export interface WaterLog {
  id?: number;
  date: string; // YYYY-MM-DD
  amount: number; // oz
  timestamp: number; // Unix ms
}

// Shape of a water_logs row returned from Supabase
export interface SupaLog {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  logged_at: string; // ISO timestamptz
}

export interface SupplementLog {
  id?: number;
  supplement_id: string;
  date: string;       // YYYY-MM-DD
  taken_at: string;   // ISO timestamp
  user_id?: string;
}

// Shape of a supplement_logs row returned from Supabase
export interface SupaSupplementLog {
  id: string;
  user_id: string;
  supplement_id: string;
  date: string;
  taken_at: string;
}

export class WaterDb extends Dexie {
  logs!: Table<WaterLog>;
  supplementLogs!: Table<SupplementLog>;

  constructor() {
    super('strHONGDb');
    this.version(1).stores({
      logs: '++id, date, timestamp',
      supplementLogs: '++id, date, supplement_id',
    });
  }
}

export const db = new WaterDb();

export async function clearAllLogs(): Promise<void> {
  await db.logs.clear();
}

// --- Supabase water_logs helpers ---

export async function fetchSupaLogs(userId: string, date: string): Promise<SupaLog[]> {
  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('logged_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SupaLog[];
}

export async function addSupaLog(
  userId: string,
  date: string,
  amount: number,
  timestamp: number
): Promise<SupaLog> {
  const { data, error } = await supabase
    .from('water_logs')
    .insert({
      user_id: userId,
      date,
      amount,
      logged_at: new Date(timestamp).toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as SupaLog;
}

export async function deleteSupaLog(id: string): Promise<void> {
  const { error } = await supabase.from('water_logs').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchSupaDailyTotals(
  userId: string,
  dates: string[]
): Promise<Record<string, number>> {
  if (dates.length === 0) return {};
  const { data, error } = await supabase
    .from('water_logs')
    .select('date, amount')
    .eq('user_id', userId)
    .in('date', dates);
  if (error) throw error;
  const totals: Record<string, number> = {};
  for (const row of data ?? []) {
    totals[row.date] = (totals[row.date] ?? 0) + Number(row.amount);
  }
  return totals;
}

// --- Supabase supplement_logs helpers ---

export async function fetchSupaSupplementLogs(
  userId: string,
  date: string
): Promise<SupaSupplementLog[]> {
  const { data, error } = await supabase
    .from('supplement_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);
  if (error) {
    // Table may not exist yet — return empty gracefully
    console.warn('supplement_logs fetch error:', error.message);
    return [];
  }
  return (data ?? []) as SupaSupplementLog[];
}

export async function addSupaSupplementLog(
  userId: string,
  supplementId: string,
  date: string
): Promise<SupaSupplementLog | null> {
  const { data, error } = await supabase
    .from('supplement_logs')
    .insert({ user_id: userId, supplement_id: supplementId, date, taken_at: new Date().toISOString() })
    .select()
    .single();
  if (error) {
    console.warn('supplement_logs insert error:', error.message);
    return null;
  }
  return data as SupaSupplementLog;
}

export async function deleteSupaSupplementLog(id: string): Promise<void> {
  const { error } = await supabase.from('supplement_logs').delete().eq('id', id);
  if (error) console.warn('supplement_logs delete error:', error.message);
}

export async function fetchSupaDailySupplementCounts(
  userId: string,
  dates: string[]
): Promise<Record<string, number>> {
  if (dates.length === 0) return {};
  const { data, error } = await supabase
    .from('supplement_logs')
    .select('date')
    .eq('user_id', userId)
    .in('date', dates);
  if (error) {
    console.warn('supplement_logs counts fetch error:', error.message);
    return {};
  }
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.date] = (counts[row.date] ?? 0) + 1;
  }
  return counts;
}
