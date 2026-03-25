import Dexie, { type Table } from 'dexie';
import { supabase } from './supabase';

export interface HydroLog {
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

export class HydroDb extends Dexie {
  logs!: Table<HydroLog>;

  constructor() {
    super('HydroDb');
    this.version(1).stores({
      logs: '++id, date, timestamp',
    });
  }
}

export const db = new HydroDb();

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
