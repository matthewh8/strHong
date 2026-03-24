'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/calculations';

interface Props {
  data: Record<string, number>; // date -> total oz
  dailyGoal: number;
  weeks?: number;
}

function getHeatColor(pct: number): string {
  if (pct === 0) return '#1e293b';
  if (pct <= 0.25) return '#dbeafe';
  if (pct <= 0.5) return '#93c5fd';
  if (pct <= 0.75) return '#3b82f6';
  return '#1e40af';
}

function buildGrid(weeks: number): { date: Date; key: string }[][] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sun

  // End on the last Saturday (or today if today is Sat)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - dayOfWeek));

  const totalDays = weeks * 7;
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  const grid: { date: Date; key: string }[][] = [];
  const cursor = new Date(startDate);

  for (let w = 0; w < weeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push({ date: new Date(cursor), key: formatDate(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function GitHubGrid({ data, dailyGoal, weeks = 8 }: Props) {
  const grid = buildGrid(weeks);
  const todayKey = formatDate(new Date());
  const [tooltip, setTooltip] = useState<{ key: string; amount: number } | null>(null);

  return (
    <div>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 pt-6">
          {DAY_INITIALS.map((d, i) => (
            <div
              key={i}
              className="h-[14px] w-3 text-[9px] flex items-center justify-center"
              style={{ color: '#475569' }}
            >
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>

        {/* Grid columns (weeks) */}
        <div className="flex gap-1 overflow-x-auto">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {/* Month label on first row */}
              <div className="h-5 text-[9px] flex items-end pb-0.5" style={{ color: '#475569' }}>
                {week[0].date.getDate() <= 7
                  ? week[0].date.toLocaleString('default', { month: 'short' })
                  : ''}
              </div>
              {week.map(({ date, key }) => {
                const amount = data[key] ?? 0;
                const pct = dailyGoal > 0 ? amount / dailyGoal : 0;
                const color = getHeatColor(pct);
                const isFuture = key > todayKey;

                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.3 }}
                    className="w-[14px] h-[14px] rounded-[3px] cursor-pointer"
                    style={{
                      background: isFuture ? '#0f172a' : color,
                      opacity: isFuture ? 0.3 : 1,
                    }}
                    onHoverStart={() => !isFuture && setTooltip({ key, amount })}
                    onHoverEnd={() => setTooltip(null)}
                    onTapStart={() => !isFuture && setTooltip(tooltip?.key === key ? null : { key, amount })}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <p className="mt-2 text-xs" style={{ color: '#94a3b8' }}>
          {tooltip.key}: {tooltip.amount} oz
        </p>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px]" style={{ color: '#475569' }}>Less</span>
        {[0, 0.2, 0.5, 0.75, 1].map((p) => (
          <div
            key={p}
            className="w-[12px] h-[12px] rounded-[2px]"
            style={{ background: getHeatColor(p) }}
          />
        ))}
        <span className="text-[10px]" style={{ color: '#475569' }}>More</span>
      </div>
    </div>
  );
}
