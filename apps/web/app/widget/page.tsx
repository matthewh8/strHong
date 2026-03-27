'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getProfile } from '@/lib/storage';
import { useWater } from '@/hooks/useWater';
import { ChevronRight } from 'lucide-react';

export default function WidgetPage() {
  const [profile, setProfile] = useState<ReturnType<typeof getProfile>>(null);
  const { total, handleIncrement } = useWater();
  const [flash, setFlash] = useState<number | null>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const dailyGoal = profile?.dailyGoal ?? 64;
  const bottleSize = profile?.bottleSize ?? 32;
  const halfBottle = Math.round(bottleSize / 2);
  const pct = Math.min(100, Math.round((total / dailyGoal) * 100));

  const RADIUS = 54;
  const CIRC = 2 * Math.PI * RADIUS;
  const dash = (pct / 100) * CIRC;

  const log = (amount: number) => {
    handleIncrement(amount);
    setFlash(amount);
    setTimeout(() => setFlash(null), 600);
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-svh"
      style={{ background: '#0f172a' }}
    >
      {/* 2×1 card */}
      <div
        className="flex rounded-3xl overflow-hidden"
        style={{
          width: 'min(92vw, 400px)',
          height: 'min(46vw, 200px)',
          background: '#1e293b',
          border: '1px solid rgba(51,65,85,0.6)',
        }}
      >
        {/* Left: total + ring */}
        <div
          className="flex flex-col items-center justify-center flex-1"
          style={{ borderRight: '1px solid rgba(51,65,85,0.5)' }}
        >
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            {/* Progress ring */}
            <svg width={120} height={120} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
              <circle cx={60} cy={60} r={RADIUS} fill="none" stroke="#263347" strokeWidth={6} />
              <motion.circle
                cx={60} cy={60} r={RADIUS}
                fill="none"
                stroke="#0096FF"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                animate={{ strokeDashoffset: CIRC - dash }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </svg>
            {/* Number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={total}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="text-3xl font-bold leading-none"
                  style={{ color: '#f1f5f9' }}
                >
                  {total}
                </motion.span>
              </AnimatePresence>
              <span className="text-xs mt-0.5" style={{ color: '#475569' }}>
                / {dailyGoal} oz
              </span>
            </div>
          </div>
        </div>

        {/* Right: two log buttons */}
        <div className="flex flex-col" style={{ width: '42%' }}>
          {[bottleSize, halfBottle].map((amt, i) => (
            <motion.button
              key={amt}
              onClick={() => log(amt)}
              whileTap={{ scale: 0.94 }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5"
              style={{
                borderBottom: i === 0 ? '1px solid rgba(51,65,85,0.5)' : 'none',
                background: flash === amt ? 'rgba(0,150,255,0.15)' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              <span className="text-xl font-bold" style={{ color: flash === amt ? '#0096FF' : '#f1f5f9' }}>
                +{amt}
              </span>
              <span className="text-xs" style={{ color: '#475569' }}>oz</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Open app link */}
      <Link
        href="/water"
        className="mt-5 flex items-center gap-1 text-sm"
        style={{ color: '#475569' }}
      >
        Open app <ChevronRight size={14} />
      </Link>
    </div>
  );
}
