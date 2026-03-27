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

/** Creatine maintenance dose in grams, adjusted for weight and age.
 *  protocol 'standard' = 0.03 g/kg (NSCA consensus), 'elevated' = 0.1 g/kg (cognitive/50+ studies) */
export function calcCreatineDose(
  weightKg: number,
  age: number,
  protocol: 'standard' | 'elevated' = 'standard'
): number {
  if (protocol === 'elevated') {
    const floor = age >= 50 ? 7 : 5;
    return Math.max(floor, Math.round(weightKg * 0.1 * 10) / 10);
  }
  const floor = age >= 50 ? 5 : 3;
  return Math.max(floor, Math.round(weightKg * 0.03 * 10) / 10);
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

/** Derive age (years) from a YYYY-MM-DD birthday string */
export function ageFromBirthday(birthday: string): number {
  const today = new Date();
  const dob = new Date(birthday);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

/** Format a timestamp to HH:MM AM/PM */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Returns the logical calendar date accounting for a day boundary hour.
 *  If it's before `boundaryHour` (default 3 AM), treat as previous calendar day.
 *  This matches how fitness apps handle late-night logging. */
export function getLogicalDate(boundaryHour = 3): string {
  const now = new Date();
  if (now.getHours() < boundaryHour) {
    now.setDate(now.getDate() - 1);
  }
  return formatDate(now);
}
