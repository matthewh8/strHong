'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Edit2, Check } from 'lucide-react';
import { getProfile, saveProfile, isFirstTimeUser } from '@/lib/storage';
import { calcDailyGoal, formatDate } from '@/lib/calculations';
import { useHydration } from '@/hooks/useHydration';
import GitHubGrid from '@/components/profile/GitHubGrid';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(getProfile());
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState(String(profile?.weight ?? ''));
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});

  const { getDailyTotals } = useHydration();

  useEffect(() => {
    if (isFirstTimeUser()) {
      router.replace('/onboarding');
    }
  }, [router]);

  // Load heatmap data for last 8 weeks (56 days)
  useEffect(() => {
    const dates: string[] = [];
    for (let i = 0; i < 56; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(formatDate(d));
    }
    getDailyTotals(dates).then(setHeatmapData);
  }, [getDailyTotals]);

  const handleSave = () => {
    if (!profile) return;
    const weightNum = parseFloat(weight);
    const updated = { ...profile, weight: weightNum, dailyGoal: calcDailyGoal(weightNum) };
    saveProfile(updated);
    setProfile(updated);
    setEditing(false);
  };

  if (!profile) return null;

  const stats = [
    { label: 'Age', value: `${profile.age} yrs` },
    { label: 'Height', value: `${profile.height} in` },
    { label: 'Weight', value: `${profile.weight} lbs` },
    { label: 'Daily Goal', value: `${profile.dailyGoal} oz` },
  ];

  return (
    <div
      className="flex flex-col h-full overflow-y-auto scrollable px-5 pt-8 pb-32"
      style={{ background: '#0f172a' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
          Profile
        </h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={editing ? handleSave : () => setEditing(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: '#1e293b', color: '#94a3b8' }}
        >
          {editing ? (
            <>
              <Check size={14} strokeWidth={2} color="#3b82f6" />
              <span style={{ color: '#3b82f6' }}>Save</span>
            </>
          ) : (
            <>
              <Edit2 size={14} strokeWidth={1.75} />
              Edit
            </>
          )}
        </motion.button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl px-4 py-4"
            style={{ background: '#1e293b' }}
          >
            <p className="text-xs mb-1" style={{ color: '#475569' }}>
              {label}
            </p>
            {editing && label === 'Weight' ? (
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-xl font-bold bg-transparent outline-none w-full"
                style={{ color: '#3b82f6' }}
                inputMode="decimal"
              />
            ) : (
              <p className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
                {label === 'Weight' && editing ? weight : value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#94a3b8' }}>
          Hydration History
        </h2>
        <div
          className="rounded-2xl p-4"
          style={{ background: '#1e293b' }}
        >
          <GitHubGrid data={heatmapData} dailyGoal={profile.dailyGoal} weeks={8} />
        </div>
      </div>

      {/* Bottle size */}
      <div className="mt-4 rounded-2xl px-4 py-4" style={{ background: '#1e293b' }}>
        <p className="text-xs mb-1" style={{ color: '#475569' }}>Bottle Size</p>
        <p className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
          {profile.bottleSize} {profile.unit}
        </p>
      </div>
    </div>
  );
}
