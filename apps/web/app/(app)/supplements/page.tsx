'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, FlaskConical } from 'lucide-react';
import { getProfile, saveProfile } from '@/lib/storage';
import { calcDailyGoal, ageFromBirthday } from '@/lib/calculations';
import { getUser } from '@/lib/auth';
import { saveProfileToSupabase } from '@/lib/storage';

const ALL_SUPPLEMENTS = [
  {
    id: 'creatine',
    label: 'Creatine',
    desc: 'Adds 16 oz to your daily goal to aid absorption.',
    icon: '💪',
  },
  {
    id: 'fish_oil',
    label: 'Fish Oil',
    desc: 'Daily omega-3 supplement.',
    icon: '🐟',
  },
  {
    id: 'multivitamin',
    label: 'Multivitamin',
    desc: 'Daily broad-spectrum vitamin.',
    icon: '💊',
  },
];

export default function SupplementsPage() {
  const [profile, setProfile] = useState(getProfile());
  const [selected, setSelected] = useState<string[]>(profile?.supplements ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Keep local state in sync if profile loads after mount
  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setSelected(p?.supplements ?? []);
  }, []);

  const toggle = (id: string) => {
    setSaved(false);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const updated = {
      ...profile,
      supplements: selected,
      dailyGoal: calcDailyGoal(profile.weight, profile.activityLevel, selected, ageFromBirthday(profile.birthday)),
    };
    saveProfile(updated);
    setProfile(updated);

    const user = await getUser();
    if (user) {
      await saveProfileToSupabase(user.id, updated);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const dirty =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify([...(profile?.supplements ?? [])].sort());

  return (
    <div
      className="flex flex-col h-full overflow-y-auto scrollable px-5 pt-8 pb-32"
      style={{ background: '#0f172a' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
          Supplements
        </h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity"
          style={{
            background: dirty ? (saved ? 'rgba(34,197,94,0.12)' : '#1e293b') : '#0f172a',
            color: dirty ? (saved ? '#22c55e' : '#94a3b8') : '#334155',
            opacity: dirty ? 1 : 0,
          }}
        >
          {saved ? (
            <>
              <Check size={14} strokeWidth={2.5} color="#22c55e" />
              <span style={{ color: '#22c55e' }}>Saved</span>
            </>
          ) : saving ? (
            <div className="h-4 w-4 rounded-full border-2 border-[#94a3b8] border-t-transparent animate-spin" />
          ) : (
            <>
              <Check size={14} strokeWidth={2} color="#3b82f6" />
              <span style={{ color: '#3b82f6' }}>Save</span>
            </>
          )}
        </motion.button>
      </div>

      <p className="text-sm mb-6" style={{ color: '#475569' }}>
        Supplements that affect your daily water goal.
      </p>

      {/* Supplement cards */}
      <div className="flex flex-col gap-3">
        {ALL_SUPPLEMENTS.map((supp) => {
          const isSelected = selected.includes(supp.id);
          return (
            <motion.button
              key={supp.id}
              onClick={() => toggle(supp.id)}
              whileTap={{ scale: 0.97 }}
              className="w-full px-5 py-4 rounded-2xl flex items-center gap-4 text-left"
              style={{
                background: isSelected ? 'rgba(0,150,255,0.08)' : '#1e293b',
                border: `2px solid ${isSelected ? '#0096FF' : 'transparent'}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: isSelected ? 'rgba(0,150,255,0.12)' : '#263347' }}
              >
                {supp.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-base font-semibold"
                  style={{ color: isSelected ? '#f1f5f9' : '#94a3b8' }}
                >
                  {supp.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: isSelected ? '#0096FF' : '#475569' }}>
                  {supp.desc}
                </p>
              </div>
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{
                  background: isSelected ? '#0096FF' : '#263347',
                  border: `1.5px solid ${isSelected ? '#0096FF' : '#334155'}`,
                }}
              >
                {isSelected && <Check size={14} color="white" strokeWidth={3} />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Current goal impact */}
      {profile && (
        <div
          className="mt-6 rounded-2xl px-4 py-4 flex items-center gap-3"
          style={{ background: '#1e293b' }}
        >
          <FlaskConical size={20} color="#0096FF" strokeWidth={1.75} />
          <div>
            <p className="text-xs" style={{ color: '#475569' }}>
              Daily water goal
            </p>
            <p className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
              {calcDailyGoal(profile.weight, profile.activityLevel, selected, ageFromBirthday(profile.birthday))} oz
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
