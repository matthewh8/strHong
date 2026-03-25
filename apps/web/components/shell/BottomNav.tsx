'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Droplets, User, RotateCcw, X, Dumbbell, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clearProfile } from '@/lib/storage';
import { clearAllLogs } from '@/lib/db';

const tabs = [
  { href: '/hydration', icon: Droplets, label: 'Water' },
  { href: null, icon: Dumbbell, label: 'soon' },
  { href: null, icon: null, label: 'reset' }, // middle — handled specially
  { href: null, icon: BarChart2, label: 'soon' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    clearProfile();
    await clearAllLogs();
    setShowConfirm(false);
    router.replace('/onboarding');
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 pb-safe"
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(51, 65, 85, 0.5)',
          height: '64px',
        }}
      >
        {tabs.map((tab, i) => {
          // Coming-soon placeholder tabs
          if (tab.label === 'soon') {
            const Icon = tab.icon!;
            return (
              <span key={i} className="flex flex-col items-center justify-center w-14 h-14" style={{ opacity: 0.25, cursor: 'not-allowed' }}>
                <Icon size={22} strokeWidth={1.5} color="#94a3b8" />
              </span>
            );
          }

          // Reset button (middle)
          if (tab.label === 'reset') {
            return (
              <motion.button
                key={i}
                onClick={() => setShowConfirm(true)}
                whileTap={{ scale: 0.85 }}
                className="flex flex-col items-center justify-center w-14 h-14"
              >
                <RotateCcw size={22} strokeWidth={1.5} color="#64748b" />
              </motion.button>
            );
          }

          // Normal nav tab
          const Icon = tab.icon!;
          const isSelected = tab.href && pathname.startsWith(tab.href);
          return (
            <Link
              key={i}
              href={tab.href!}
              className="flex flex-col items-center justify-center w-14 h-14"
            >
              <Icon
                size={22}
                strokeWidth={isSelected ? 2.5 : 1.5}
                color={isSelected ? '#0096FF' : '#94a3b8'}
              />
            </Link>
          );
        })}
      </nav>

      {/* Confirm modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-[480px] rounded-t-3xl px-6 pt-6 pb-10"
              style={{ background: '#1e293b' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>
                  Reset Everything
                </h2>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="p-1 rounded-full"
                  style={{ color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                This clears all your water logs and profile data, then restarts setup. This can't be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: '#263347', color: '#94a3b8' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: '#ef4444', color: 'white' }}
                >
                  Reset & Restart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
