'use client';
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/calculations';

interface Props {
  selectedDate: string;
  data: Record<string, number>; // date -> total oz
  dailyGoal: number;
  onDateSelect: (date: string) => void;
}

function buildDateWindow(): { date: Date; key: string }[] {
  const dates = [];
  const today = new Date();
  for (let i = -7; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({ date: d, key: formatDate(d) });
  }
  return dates;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function RunnaCalendar({ selectedDate, data, dailyGoal, onDateSelect }: Props) {
  const dates = buildDateWindow();
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayKey = formatDate(new Date());

  // Scroll so today is visible/centered on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const todayIndex = dates.findIndex((d) => d.key === todayKey);
    const itemWidth = 56; // approx width of each date cell
    const offset = todayIndex * itemWidth - el.clientWidth / 2 + itemWidth / 2;
    el.scrollTo({ left: offset, behavior: 'instant' });
  }, []); // eslint-disable-line

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto px-4 py-3 scrollable"
      style={{ scrollbarWidth: 'none' }}
    >
      {dates.map(({ date, key }) => {
        const isSelected = key === selectedDate;
        const isToday = key === todayKey;
        const total = data[key] ?? 0;
        const goalMet = dailyGoal > 0 && total >= dailyGoal;
        const dayLabel = DAY_LABELS[date.getDay()];
        const dayNum = date.getDate();

        return (
          <motion.button
            key={key}
            onClick={() => onDateSelect(key)}
            whileTap={{ scale: 0.92 }}
            className="flex flex-col items-center justify-center min-w-[52px] py-2 rounded-xl cursor-pointer select-none"
            style={{
              background: isSelected ? 'white' : 'transparent',
            }}
          >
            <span
              className="text-[11px] font-medium"
              style={{ color: isSelected ? '#0f172a' : '#94a3b8' }}
            >
              {dayLabel}
            </span>
            <span
              className="text-[17px] font-semibold mt-0.5"
              style={{ color: isSelected ? '#0f172a' : isToday ? '#f1f5f9' : '#64748b' }}
            >
              {dayNum}
            </span>
            {/* Month label for 1st of month */}
            {dayNum === 1 && (
              <span
                className="text-[9px] mt-0.5"
                style={{ color: isSelected ? '#475569' : '#475569' }}
              >
                {MONTH_LABELS[date.getMonth()]}
              </span>
            )}
            {/* Goal met indicator dot */}
            <div className="h-1.5 flex items-center justify-center mt-1">
              {goalMet && (
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: isSelected ? '#3b82f6' : '#3b82f6' }}
                />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
