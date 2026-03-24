'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isFirstTimeUser } from '@/lib/storage';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (isFirstTimeUser()) {
      router.replace('/onboarding');
    } else {
      router.replace('/hydration');
    }
  }, [router]);

  return (
    <div className="flex h-svh items-center justify-center bg-[var(--color-background)]">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
    </div>
  );
}
