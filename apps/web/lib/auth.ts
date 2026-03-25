import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export type { User, Session };

export async function signInWithEmail(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  return { error: error?.message ?? null };
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  return { error: error?.message ?? null };
}

export async function signInAsGuest(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInAnonymously();
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function deleteAccount(userId: string): Promise<{ error: string | null }> {
  const res = await fetch('/api/delete-account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const json = await res.json();
  return { error: json.error ?? null };
}
