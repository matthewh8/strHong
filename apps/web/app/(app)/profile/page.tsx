export const dynamic = 'force-dynamic';
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, LogOut, X } from 'lucide-react';
import { getProfile, saveProfile, isFirstTimeUser, saveProfileToSupabase, clearProfile } from '@/lib/storage';
import { calcDailyGoal, ageFromBirthday, formatDate } from '@/lib/calculations';
import { useHydration } from '@/hooks/useHydration';
import GitHubGrid from '@/components/profile/GitHubGrid';
import { getUser, signOut, deleteAccount } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';

const ACTIVITY_LABELS = ['', 'Sedentary', 'Light', 'Moderate', 'Active', 'Very Active', 'Extra Active'];

type EditField = 'birthday' | 'height' | 'weight' | 'activityLevel' | 'bottleSize' | 'unit' | null;

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState(getProfile());
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [editField, setEditField] = useState<EditField>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Temporary edit values
  const [editBirthday, setEditBirthday] = useState('');
  const [editHeightFt, setEditHeightFt] = useState('');
  const [editHeightIn, setEditHeightIn] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editActivity, setEditActivity] = useState(1);
  const [editBottle, setEditBottle] = useState('');
  const [editUnit, setEditUnit] = useState<'oz' | 'ml'>('oz');

  const { getDailyTotals } = useHydration();

  useEffect(() => {
    if (isFirstTimeUser()) router.replace('/onboarding');
  }, [router]);

  useEffect(() => {
    const dates: string[] = [];
    for (let i = 0; i < 56; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(formatDate(d));
    }
    getDailyTotals(dates).then(setHeatmapData);
  }, [getDailyTotals]);

  const openEdit = (field: EditField) => {
    if (!profile) return;
    if (field === 'birthday') setEditBirthday(profile.birthday);
    if (field === 'height') { setEditHeightFt(String(profile.heightFt)); setEditHeightIn(String(profile.heightIn)); }
    if (field === 'weight') setEditWeight(String(profile.weight));
    if (field === 'activityLevel') setEditActivity(profile.activityLevel);
    if (field === 'bottleSize') setEditBottle(String(profile.bottleSize));
    if (field === 'unit') setEditUnit(profile.unit);
    setEditField(field);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    let updated = { ...profile };
    if (editField === 'birthday') {
      updated = { ...updated, birthday: editBirthday };
    } else if (editField === 'height') {
      updated = { ...updated, heightFt: parseInt(editHeightFt) || profile.heightFt, heightIn: parseInt(editHeightIn) || 0 };
    } else if (editField === 'weight') {
      updated = { ...updated, weight: parseFloat(editWeight) || profile.weight };
    } else if (editField === 'activityLevel') {
      updated = { ...updated, activityLevel: editActivity };
    } else if (editField === 'bottleSize') {
      updated = { ...updated, bottleSize: parseFloat(editBottle) || profile.bottleSize };
    } else if (editField === 'unit') {
      updated = { ...updated, unit: editUnit };
    }

    const age = ageFromBirthday(updated.birthday);
    updated.dailyGoal = calcDailyGoal(updated.weight, updated.activityLevel, updated.supplements, age);

    saveProfile(updated);
    setProfile(updated);

    const authUser = await getUser();
    if (authUser) await saveProfileToSupabase(authUser.id, updated);

    setSaving(false);
    setEditField(null);
  };

  const handleSignOut = async () => {
    await signOut();
    clearProfile();
    router.replace('/login');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    await deleteAccount(user.id);
    await signOut();
    clearProfile();
    router.replace('/login');
  };

  if (!profile) return null;

  const age = ageFromBirthday(profile.birthday);
  const email = user?.email ?? '';
  const initials = email ? email.slice(0, 2).toUpperCase() : 'HO';

  const editModalTitles: Record<NonNullable<EditField>, string> = {
    birthday: 'Edit Age',
    height: 'Edit Height',
    weight: 'Edit Weight',
    activityLevel: 'Activity Level',
    bottleSize: 'Bottle Size',
    unit: 'Unit',
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollable pb-32" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4">
        <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>My Account</h1>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={14} strokeWidth={1.75} />
          Sign out
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center pb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6' }}
        >
          {initials}
        </div>
        {email && (
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>{email}</p>
        )}
      </div>

      <div className="px-5 flex flex-col gap-4">
        {/* Health Stats */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: '#475569' }}>
            Health Stats
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#1e293b' }}>
            <StatRow label="Age" value={String(age)} onTap={() => openEdit('birthday')} />
            <Divider />
            <StatRow label="Height" value={`${profile.heightFt}'${profile.heightIn}"`} onTap={() => openEdit('height')} />
            <Divider />
            <StatRow label="Weight" value={`${profile.weight} lbs`} onTap={() => openEdit('weight')} />
            <Divider />
            <StatRow label="Activity" value={ACTIVITY_LABELS[profile.activityLevel]} onTap={() => openEdit('activityLevel')} />
          </div>
        </div>

        {/* Hydration */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: '#475569' }}>
            Hydration
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#1e293b' }}>
            <StatRow label="Daily Goal" value={`${profile.dailyGoal} oz`} />
            <Divider />
            <StatRow label="Bottle Size" value={`${profile.bottleSize} ${profile.unit}`} onTap={() => openEdit('bottleSize')} />
            <Divider />
            <StatRow label="Unit" value={profile.unit === 'oz' ? 'fl oz' : 'ml'} onTap={() => openEdit('unit')} />
          </div>
        </div>

        {/* Heatmap */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: '#475569' }}>
            Hydration History
          </p>
          <div className="rounded-2xl p-4" style={{ background: '#1e293b' }}>
            <GitHubGrid data={heatmapData} dailyGoal={profile.dailyGoal} weeks={8} />
          </div>
        </div>

        {/* Danger zone */}
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold mt-2"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          Delete Account
        </button>
      </div>

      {/* Centered edit modal */}
      <AnimatePresence>
        {editField && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setEditField(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full max-w-[400px] mx-4 rounded-3xl px-6 py-6"
              style={{ background: '#1e293b' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>
                  {editField ? editModalTitles[editField] : ''}
                </h2>
                <button onClick={() => setEditField(null)} style={{ color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              {editField === 'birthday' && (
                <input
                  type="date"
                  value={editBirthday}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-base outline-none mb-5"
                  style={{ background: '#263347', color: '#f1f5f9', colorScheme: 'dark', border: 'none' }}
                />
              )}

              {editField === 'height' && (
                <div className="flex gap-3 mb-5">
                  <div className="flex-1">
                    <label className="text-xs mb-1 block" style={{ color: '#64748b' }}>Feet</label>
                    <input
                      type="number"
                      value={editHeightFt}
                      onChange={(e) => setEditHeightFt(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-base outline-none"
                      style={{ background: '#263347', color: '#f1f5f9', border: 'none' }}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs mb-1 block" style={{ color: '#64748b' }}>Inches</label>
                    <input
                      type="number"
                      value={editHeightIn}
                      onChange={(e) => setEditHeightIn(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-base outline-none"
                      style={{ background: '#263347', color: '#f1f5f9', border: 'none' }}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              )}

              {editField === 'weight' && (
                <div className="mb-5">
                  <label className="text-xs mb-1 block" style={{ color: '#64748b' }}>Weight (lbs)</label>
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-base outline-none"
                    style={{ background: '#263347', color: '#f1f5f9', border: 'none' }}
                    inputMode="decimal"
                  />
                </div>
              )}

              {editField === 'activityLevel' && (
                <div className="flex flex-col gap-2 mb-5">
                  {([1, 2, 3, 4, 5, 6] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setEditActivity(lvl)}
                      className="flex items-center px-4 py-3 rounded-xl text-sm font-medium"
                      style={{
                        background: editActivity === lvl ? 'rgba(59,130,246,0.15)' : '#263347',
                        color: editActivity === lvl ? '#3b82f6' : '#94a3b8',
                        border: `1.5px solid ${editActivity === lvl ? '#3b82f6' : 'transparent'}`,
                      }}
                    >
                      {ACTIVITY_LABELS[lvl]}
                    </button>
                  ))}
                </div>
              )}

              {editField === 'bottleSize' && (
                <div className="mb-5">
                  <label className="text-xs mb-1 block" style={{ color: '#64748b' }}>Size (oz)</label>
                  <input
                    type="number"
                    value={editBottle}
                    onChange={(e) => setEditBottle(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-base outline-none"
                    style={{ background: '#263347', color: '#f1f5f9', border: 'none' }}
                    inputMode="decimal"
                  />
                </div>
              )}

              {editField === 'unit' && (
                <div className="flex gap-3 mb-5">
                  {(['oz', 'ml'] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => setEditUnit(u)}
                      className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                      style={{
                        background: editUnit === u ? 'rgba(59,130,246,0.15)' : '#263347',
                        color: editUnit === u ? '#3b82f6' : '#94a3b8',
                        border: `1.5px solid ${editUnit === u ? '#3b82f6' : 'transparent'}`,
                      }}
                    >
                      {u === 'oz' ? 'fl oz' : 'ml'}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                style={{ background: '#3b82f6', color: 'white' }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete account confirm modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full max-w-[400px] mx-4 rounded-3xl px-6 py-6"
              style={{ background: '#1e293b' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-1" style={{ color: '#f1f5f9' }}>
                Delete account?
              </h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                This permanently deletes your account and all hydration data. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium"
                  style={{ background: '#263347', color: '#94a3b8' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Divider() {
  return <div className="h-px mx-4" style={{ background: 'rgba(51,65,85,0.5)' }} />;
}

function StatRow({ label, value, onTap }: {
  label: string;
  value: string;
  onTap?: () => void;
}) {
  return (
    <button
      onClick={onTap}
      disabled={!onTap}
      className="w-full flex items-center justify-between px-4 py-4 text-left"
      style={{ cursor: onTap ? 'pointer' : 'default' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: '#64748b' }}>{label}</p>
        <p className="text-sm font-semibold truncate" style={{ color: '#f1f5f9' }}>{value}</p>
      </div>
      {onTap && <ChevronRight size={16} color="#475569" />}
    </button>
  );
}
