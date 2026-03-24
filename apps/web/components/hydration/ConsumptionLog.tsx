'use client';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { type HydroLog } from '@/lib/db';
import { formatTime } from '@/lib/calculations';

interface Props {
  logs: HydroLog[];
  onDelete: (id: number) => void;
}

function LogEntry({ log, onDelete }: { log: HydroLog; onDelete: (id: number) => void }) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-80, -40], [1, 0]);
  const background = useTransform(x, [-80, 0], ['rgba(239,68,68,0.2)', 'transparent']);

  const handleDragEnd = () => {
    if (x.get() < -60) {
      onDelete(log.id!);
    } else {
      x.set(0);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60, height: 0, marginBottom: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative overflow-hidden rounded-xl mb-2"
    >
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-4 rounded-xl"
        style={{ background, opacity: deleteOpacity }}
      >
        <Trash2 size={18} color="#ef4444" />
      </motion.div>

      {/* Draggable row */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        style={{ x, background: 'rgba(30, 41, 59, 0.8)' }}
        onDragEnd={handleDragEnd}
        className="flex items-center justify-between px-4 py-3 rounded-xl cursor-grab active:cursor-grabbing"
      >
        <span className="text-sm" style={{ color: '#94a3b8' }}>
          {formatTime(log.timestamp)}
        </span>
        <span className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
          +{log.amount} oz
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function ConsumptionLog({ logs, onDelete }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 scrollable">
      {logs.length === 0 ? (
        <p className="text-center text-sm mt-6" style={{ color: '#334155' }}>
          No entries yet. Tap a circle to log water.
        </p>
      ) : (
        <AnimatePresence mode="popLayout">
          {[...logs].reverse().map((log) => (
            <LogEntry key={log.id} log={log} onDelete={onDelete} />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
