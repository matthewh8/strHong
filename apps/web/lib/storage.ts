import { supabase } from './supabase';
import { ageFromBirthday } from './calculations';

export interface UserProfile {
  birthday: string; // YYYY-MM-DD
  heightFt: number;
  heightIn: number;
  weight: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: number; // 1–6
  supplements: string[];
  bottleSize: number; // oz
  unit: 'oz' | 'ml';
  dailyGoal: number; // oz
}

// snake_case shape that matches the Supabase user_profiles table
interface SupaProfile {
  id: string;
  birthday: string | null;
  age: number;
  height_ft: number;
  height_in: number;
  weight: number;
  gender: string;
  activity_level: number;
  supplements: string[];
  bottle_size: number;
  unit: string;
  daily_goal: number;
}

function toSupaShape(userId: string, p: UserProfile): SupaProfile {
  return {
    id: userId,
    birthday: p.birthday,
    age: ageFromBirthday(p.birthday),
    height_ft: p.heightFt,
    height_in: p.heightIn,
    weight: p.weight,
    gender: p.gender,
    activity_level: p.activityLevel,
    supplements: p.supplements,
    bottle_size: p.bottleSize,
    unit: p.unit,
    daily_goal: p.dailyGoal,
  };
}

function fromSupaShape(row: SupaProfile): UserProfile {
  // Derive birthday from age if not stored yet (backward compat)
  const birthday = row.birthday ?? `${new Date().getFullYear() - (row.age ?? 25)}-01-01`;
  return {
    birthday,
    heightFt: row.height_ft,
    heightIn: row.height_in,
    weight: Number(row.weight),
    gender: row.gender as UserProfile['gender'],
    activityLevel: row.activity_level,
    supplements: row.supplements ?? [],
    bottleSize: Number(row.bottle_size),
    unit: row.unit as UserProfile['unit'],
    dailyGoal: Number(row.daily_goal),
  };
}

const PROFILE_KEY = 'strHONG_user_profile';
const LEGACY_PROFILE_KEY = 'hydro_user_profile';

// --- localStorage helpers ---

export function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  // One-time migration from legacy key
  const legacy = localStorage.getItem(LEGACY_PROFILE_KEY);
  if (legacy) {
    localStorage.setItem(PROFILE_KEY, legacy);
    localStorage.removeItem(LEGACY_PROFILE_KEY);
  }
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function isFirstTimeUser(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('isFirstTimeUser') !== 'false';
}

export function setOnboardingComplete(): void {
  localStorage.setItem('isFirstTimeUser', 'false');
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(LEGACY_PROFILE_KEY);
  localStorage.removeItem('isFirstTimeUser');
}

// --- Supabase profile helpers ---

export async function saveProfileToSupabase(
  userId: string,
  profile: UserProfile
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(toSupaShape(userId, profile), { onConflict: 'id' });
  return { error: error?.message ?? null };
}

export async function loadProfileFromSupabase(
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return fromSupaShape(data as SupaProfile);
}
