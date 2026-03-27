'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/shell/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        router.replace('/login');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-svh items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="h-8 w-8 rounded-full border-2 border-[#0096FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-svh max-w-[480px] mx-auto relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
