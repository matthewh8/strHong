'use client';
import { motion, AnimatePresence, useMotionValue, animate, useTransform } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { formatTime } from '@/lib/calculations';
import { type WaterLogLocal } from '@/hooks/useWater';

interface Props {
  logs: WaterLogLocal[];
  onDelete: (id: number | string) => void;
}

function LogEntry({ log, onDelete, isLast }: { log: WaterLogLocal; onDelete: (id: number | string) => void; isLast: boolean }) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-72, -20], [1, 0]);

  const handleDragEnd = () => {
    const target = x.get() < -36 ? -72 : 0;
    animate(x, target, { type: 'spring', stiffness: 400, damping: 40 });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative overflow-hidden"
    >
      {/* Delete zone */}
      <motion.div
        className="absolute top-0 right-0 bottom-0 flex items-center justify-center"
        style={{ width: 72, background: '#ef4444', cursor: 'pointer', opacity: deleteOpacity }}
        onClick={() => onDelete(log.id!)}
      >
        <Trash2 size={18} color="white" strokeWidth={2} />
      </motion.div>

      {/* Draggable row */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -72, right: 0 }}
        dragElastic={0.1}
        style={{ x, background: '#0f172a' }}
        onDragEnd={handleDragEnd}
        className="flex items-center justify-between py-3.5 cursor-grab active:cursor-grabbing"
      >
        <span className="text-sm" style={{ color: '#64748b', pointerEvents: 'none' }}>
          {formatTime(log.timestamp)}
        </span>
        <span className="text-sm font-semibold" style={{ color: '#f1f5f9', pointerEvents: 'none' }}>
          +{log.amount} oz
        </span>
      </motion.div>

      {!isLast && (
        <div className="h-px" style={{ background: 'rgba(51,65,85,0.4)' }} />
      )}
    </motion.div>
  );
}

export default function ConsumptionLog({ logs, onDelete }: Props) {
  const reversed = [...logs].reverse();
  return (
    <div className="px-4 pb-6">
      {logs.length === 0 ? (
        <p className="text-center text-sm mt-6" style={{ color: '#334155' }}>
          No entries yet. Tap a circle to log water.
        </p>
      ) : (
        <AnimatePresence mode="popLayout">
          {reversed.map((log, i) => (
            <LogEntry
              key={log.id}
              log={log}
              onDelete={onDelete}
              isLast={i === reversed.length - 1}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
