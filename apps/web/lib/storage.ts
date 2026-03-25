export interface UserProfile {
  age: number;
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

export function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('hydro_user_profile');
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem('hydro_user_profile', JSON.stringify(profile));
}

export function isFirstTimeUser(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('isFirstTimeUser') !== 'false';
}

export function setOnboardingComplete(): void {
  localStorage.setItem('isFirstTimeUser', 'false');
}

export function clearProfile(): void {
  localStorage.removeItem('hydro_user_profile');
  localStorage.removeItem('isFirstTimeUser');
}
