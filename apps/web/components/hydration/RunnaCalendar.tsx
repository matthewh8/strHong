'use client';
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
  for (let i = -3; i <= 3; i++) {
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
  const todayKey = formatDate(new Date());

  return (
    <div className="flex px-2 py-3">
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
            className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl cursor-pointer select-none"
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
                  style={{ background: '#3b82f6' }}
                />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
