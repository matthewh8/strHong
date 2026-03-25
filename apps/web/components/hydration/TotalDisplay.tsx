'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, RotateCw } from 'lucide-react';

interface Props {
  total: number;
  dailyGoal: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function TotalDisplay({ total, dailyGoal, canUndo, canRedo, onUndo, onRedo }: Props) {
  const pct = dailyGoal > 0 ? Math.min(100, (total / dailyGoal)) : 0;

  const RADIUS = 88;
  const STROKE = 8;
  const SIZE = 200;
  const CENTER = SIZE / 2;
  const CIRC = 2 * Math.PI * RADIUS;
  const dash = pct * CIRC;

  return (
    <div className="flex flex-col items-center py-6">
      {/* Undo / Ring / Redo row */}
      <div className="flex items-center gap-6">
        <motion.button
          onClick={onUndo}
          whileTap={{ scale: 0.85 }}
          disabled={!canUndo}
          className="p-2 rounded-full"
          style={{ opacity: canUndo ? 1 : 0.25 }}
        >
          <RotateCcw size={20} strokeWidth={1.75} color="#94a3b8" />
        </motion.button>

        {/* SVG Ring */}
        <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={STROKE}
            />
            {/* Progress arc */}
            <motion.circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: CIRC - dash }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={total}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="text-6xl font-bold tracking-tight leading-none"
                style={{ color: '#f1f5f9' }}
              >
                {total}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm mt-1.5" style={{ color: '#64748b' }}>
              / {dailyGoal} oz
            </span>
          </div>
        </div>

        <motion.button
          onClick={onRedo}
          whileTap={{ scale: 0.85 }}
          disabled={!canRedo}
          className="p-2 rounded-full"
          style={{ opacity: canRedo ? 1 : 0.25 }}
        >
          <RotateCw size={20} strokeWidth={1.75} color="#94a3b8" />
        </motion.button>
      </div>
    </div>
  );
}
