import Dexie, { type Table } from 'dexie';

export interface HydroLog {
  id?: number;
  date: string; // YYYY-MM-DD
  amount: number; // oz
  timestamp: number; // Unix ms
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
