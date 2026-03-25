'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { loadProfileFromSupabase, saveProfile, setOnboardingComplete } from '@/lib/storage';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        // Check if user already has a profile in Supabase (returning user on new device)
        const profile = await loadProfileFromSupabase(session.user.id);
        if (profile) {
          saveProfile(profile);
          setOnboardingComplete();
          router.replace('/hydration');
        } else {
          router.replace('/onboarding');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex h-svh items-center justify-center" style={{ background: '#0f172a' }}>
      <div className="h-8 w-8 rounded-full border-2 border-[#0096FF] border-t-transparent animate-spin" />
    </div>
  );
}
