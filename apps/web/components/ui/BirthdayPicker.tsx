'use client';
import DrumRoller from './DrumRoller';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1924 }, (_, i) => 1925 + i);

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
}

export default function BirthdayPicker({ value, onChange }: Props) {
  const parts = value.split('-').map(Number);
  const year = parts[0] || CURRENT_YEAR - 25;
  const month = parts[1] || 1; // 1-indexed
  const day = parts[2] || 1;
  const monthName = MONTH_NAMES[month - 1] ?? 'Jan';

  const update = (type: 'month' | 'day' | 'year', val: string | number) => {
    let y = year, m = month, d = day;
    if (type === 'month') m = MONTH_NAMES.indexOf(val as string) + 1;
    if (type === 'day') d = val as number;
    if (type === 'year') y = val as number;
    onChange(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  };

  return (
    <div className="flex gap-2">
      <div className="flex-[1.3] rounded-xl overflow-hidden" style={{ background: '#263347' }}>
        <DrumRoller
          items={MONTH_NAMES}
          value={monthName}
          onChange={(v) => update('month', v)}
          label="Month"
        />
      </div>
      <div className="flex-[0.8] rounded-xl overflow-hidden" style={{ background: '#263347' }}>
        <DrumRoller
          items={DAYS}
          value={day}
          onChange={(v) => update('day', v)}
          label="Day"
        />
      </div>
      <div className="flex-1 rounded-xl overflow-hidden" style={{ background: '#263347' }}>
        <DrumRoller
          items={YEARS}
          value={year}
          onChange={(v) => update('year', v)}
          label="Year"
        />
      </div>
    </div>
  );
}
