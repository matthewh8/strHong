/** Daily water goal in oz: weight (lbs) × 0.5 */
export function calcDailyGoal(weightLbs: number): number {
  return Math.round(weightLbs * 0.5);
}

/** Convert oz to ml */
export function ozToMl(oz: number): number {
  return Math.round(oz * 29.5735);
}

/** Convert ml to oz */
export function mlToOz(ml: number): number {
  return Math.round(ml / 29.5735);
}

/** Format a Date to YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Format a timestamp to HH:MM AM/PM */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
