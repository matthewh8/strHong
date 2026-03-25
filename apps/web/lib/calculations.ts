const ACTIVITY_MULTIPLIERS = [1.0, 1.2, 1.4, 1.55, 1.7, 1.85];

function ageMultiplier(age: number): number {
  if (age < 18) return 0.9;
  if (age < 55) return 1.0;
  if (age < 70) return 1.1;
  return 1.15;
}

/** Daily water goal in oz, adjusted for weight, activity level (1–6), supplements, and age */
export function calcDailyGoal(
  weightLbs: number,
  activityLevel = 1,
  supplements: string[] = [],
  age = 25
): number {
  const base = weightLbs * 0.5;
  const actMultiplier = ACTIVITY_MULTIPLIERS[activityLevel - 1] ?? 1.0;
  const ageMult = ageMultiplier(age);
  const creatineBonus = supplements.includes('creatine') ? 16 : 0;
  return Math.round(base * actMultiplier * ageMult + creatineBonus);
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
