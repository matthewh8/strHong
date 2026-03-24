'use client';
import { motion } from 'framer-motion';

interface Props {
  bottleSize: number; // oz
  isCurrentDay: boolean;
  onIncrement: (amount: number) => void;
  onPastDayTap?: () => void;
}

export default function ActionCircles({ bottleSize, isCurrentDay, onIncrement, onPastDayTap }: Props) {
  const actions = [
    { label: '+1', amount: 1 },
    { label: `+${Math.round(bottleSize / 2)}`, amount: Math.round(bottleSize / 2) },
    { label: `+${bottleSize}`, amount: bottleSize },
  ];

  const handleTap = (amount: number) => {
    if (!isCurrentDay && onPastDayTap) {
      onPastDayTap();
      return;
    }
    onIncrement(amount);
  };

  return (
    <div
      className="flex justify-center gap-6 px-4"
      style={{ opacity: isCurrentDay ? 1 : 0.7 }}
    >
      {actions.map(({ label, amount }) => (
        <motion.button
          key={label}
          onClick={() => handleTap(amount)}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 600, damping: 20 }}
          className="flex flex-col items-center justify-center w-20 h-20 rounded-full text-sm font-semibold select-none"
          style={{
            border: '1.5px solid rgba(241, 245, 249, 0.6)',
            color: '#f1f5f9',
            background: 'transparent',
          }}
        >
          <span className="text-base font-bold">{label}</span>
          <span className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>
            oz
          </span>
        </motion.button>
      ))}
    </div>
  );
}
