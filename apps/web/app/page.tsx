'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isFirstTimeUser } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION') return;
      if (!session) {
        router.replace('/login');
      } else if (session.user.is_anonymous && !sessionStorage.getItem('guestActive')) {
        // Stale anonymous session from a previous browser session — clear it
        supabase.auth.signOut().then(() => router.replace('/login'));
      } else if (isFirstTimeUser()) {
        router.replace('/onboarding');
      } else {
        router.replace('/hydration');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex h-svh items-center justify-center bg-[var(--color-background)]">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
    </div>
  );
}
