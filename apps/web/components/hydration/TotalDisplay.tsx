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
  const pct = dailyGoal > 0 ? Math.min(100, Math.round((total / dailyGoal) * 100)) : 0;

  return (
    <div className="flex flex-col items-center py-6">
      {/* Undo / Total / Redo row */}
      <div className="flex items-center gap-8">
        <motion.button
          onClick={onUndo}
          whileTap={{ scale: 0.85 }}
          disabled={!canUndo}
          className="p-2 rounded-full"
          style={{ opacity: canUndo ? 1 : 0.25 }}
        >
          <RotateCcw size={20} strokeWidth={1.75} color="#94a3b8" />
        </motion.button>

        <div className="flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={total}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="text-6xl font-bold tracking-tight"
              style={{ color: '#f1f5f9' }}
            >
              {total}
            </motion.span>
          </AnimatePresence>
          <span className="text-base mt-1" style={{ color: '#64748b' }}>
            oz
          </span>
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

      {/* Progress bar */}
      <div className="mt-4 w-48 h-1.5 rounded-full" style={{ background: '#1e293b' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: '#0096FF' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <span className="mt-1.5 text-xs" style={{ color: '#475569' }}>
        {pct}% of {dailyGoal} oz goal
      </span>
    </div>
  );
}
