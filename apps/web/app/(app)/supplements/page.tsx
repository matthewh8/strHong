'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { getProfile, saveProfile, saveProfileToSupabase } from '@/lib/storage';
import { calcDailyGoal, calcCreatineDose, ageFromBirthday } from '@/lib/calculations';
import { getUser } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { useSupplements, resolveConfig, getSupplementConfigs, saveSupplementConfigs, type SupplementConfig } from '@/hooks/useSupplements';
import RunnaCalendar from '@/components/water/RunnaCalendar';
import { formatDate } from '@/lib/calculations';

const PRESET_SUPPLEMENTS: SupplementConfig[] = [
  { id: 'creatine',     label: 'Creatine',     emoji: '💪', notes: 'with water' },
  { id: 'fish_oil',     label: 'Fish Oil',     emoji: '🐟', dose: '1000mg' },
  { id: 'multivitamin', label: 'Multivitamin', emoji: '💊' },
  { id: 'vitamin_d',    label: 'Vitamin D',    emoji: '☀️', dose: '2000 IU' },
  { id: 'magnesium',    label: 'Magnesium',    emoji: '🪨', dose: '200mg' },
  { id: 'zinc',         label: 'Zinc',         emoji: '⚡', dose: '15mg' },
  { id: 'protein',      label: 'Protein',      emoji: '🥛', notes: 'post-workout' },
  { id: 'pre_workout',  label: 'Pre-Workout',  emoji: '🔥', notes: 'before training' },
];

const AMBER = '#F59E0B';
const AMBER_BG = 'rgba(245, 158, 11, 0.08)';
const AMBER_BORDER = 'rgba(245, 158, 11, 0.3)';

export default function SupplementsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(getProfile());
  const [supplementIds, setSupplementIds] = useState<string[]>(profile?.supplements ?? []);
  const [calendarData, setCalendarData] = useState<Record<string, number>>({});

  // Past-day modal
  const [confirmModal, setConfirmModal] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  // Edit mode modal
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('💊');
  const [customDose, setCustomDose] = useState('');
  const [saving, setSaving] = useState(false);

  // Undo snackbar
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const {
    today,
    selectedDate,
    isCurrentDay,
    takenIds,
    toggleTaken,
    handleDateChange,
    getDailyTakenCounts,
  } = useSupplements(supplementIds, user?.id);

  // Load calendar data
  useEffect(() => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - 3 + i);
      dates.push(formatDate(d));
    }
    getDailyTakenCounts(dates).then(setCalendarData);
  }, [getDailyTakenCounts]);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setSupplementIds(p?.supplements ?? []);
  }, []);

  const handleToggle = (id: string) => {
    if (!isCurrentDay) {
      setPendingToggleId(id);
      setConfirmModal(true);
      return;
    }
    doToggle(id);
  };

  const doToggle = async (id: string) => {
    const wasTaken = takenIds.has(id);
    await toggleTaken(id);
    const config = resolveConfig(id, getSupplementConfigs()[id]);
    setSnackbar(wasTaken ? `${config.label} marked as not taken` : `${config.label} marked as taken ✓`);
    setTimeout(() => setSnackbar(null), 3000);
  };

  const confirmPastDay = () => {
    if (pendingToggleId) doToggle(pendingToggleId);
    setPendingToggleId(null);
    setConfirmModal(false);
  };

  const saveSupplementList = async (updatedIds: string[]) => {
    if (!profile) return;
    setSaving(true);
    setSupplementIds(updatedIds);
    const updated = {
      ...profile,
      supplements: updatedIds,
      dailyGoal: calcDailyGoal(profile.weight, profile.activityLevel, updatedIds, ageFromBirthday(profile.birthday)),
    };
    saveProfile(updated);
    setProfile(updated);
    const authUser = await getUser();
    if (authUser) await saveProfileToSupabase(authUser.id, updated);
    setSaving(false);
  };

  const handleRemoveSupplement = async (id: string) => {
    const updated = supplementIds.filter((s) => s !== id);
    await saveSupplementList(updated);
    setDeleteConfirmId(null);
  };

  const handleAddPreset = async (preset: SupplementConfig) => {
    if (supplementIds.includes(preset.id)) return;
    const configs = getSupplementConfigs();
    configs[preset.id] = preset;
    saveSupplementConfigs(configs);
    await saveSupplementList([...supplementIds, preset.id]);
  };

  const handleAddCustom = async () => {
    if (!customName.trim()) return;
    const id = `custom_${Date.now()}`;
    const config: SupplementConfig = {
      id,
      label: customName.trim(),
      emoji: customEmoji,
      dose: customDose.trim() || undefined,
    };
    const configs = getSupplementConfigs();
    configs[id] = config;
    saveSupplementConfigs(configs);
    await saveSupplementList([...supplementIds, id]);
    setCustomName('');
    setCustomDose('');
    setCustomEmoji('💊');
    setAddOpen(false);
  };

  // Build resolved supplement configs
  const configs = getSupplementConfigs();
  const resolvedSupplements = supplementIds.map((id) => resolveConfig(id, configs[id]));

  // Creatine dose for display
  const creatineDose = profile
    ? calcCreatineDose(profile.weight * 0.453592, ageFromBirthday(profile.birthday))
    : 5;

  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const dayLabel = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const allTaken = supplementIds.length > 0 && supplementIds.every((id) => takenIds.has(id));

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollable" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-2">
        <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Supplements</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: '#1e293b', color: '#94a3b8' }}
        >
          <Pencil size={13} strokeWidth={2} />
          Edit
        </motion.button>
      </div>

      {/* Calendar */}
      <RunnaCalendar
        selectedDate={selectedDate}
        data={calendarData}
        dailyGoal={supplementIds.length}
        onDateSelect={handleDateChange}
      />

      {/* Date label */}
      <div className="px-5 pb-3">
        <p className="text-xs" style={{ color: '#475569' }}>
          {isCurrentDay ? 'Today' : dayLabel}
          {allTaken && supplementIds.length > 0 && (
            <span style={{ color: AMBER, marginLeft: 6 }}>· All taken ✓</span>
          )}
        </p>
      </div>

      {/* Supplement cards */}
      <div className="flex flex-col gap-3 px-5 pb-32">
        {resolvedSupplements.length === 0 && (
          <div
            className="rounded-2xl px-5 py-8 flex flex-col items-center gap-3 text-center"
            style={{ background: '#1e293b' }}
          >
            <span className="text-4xl">💊</span>
            <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
              No supplements yet
            </p>
            <p className="text-xs" style={{ color: '#475569' }}>
              Tap Edit to add supplements to your daily stack
            </p>
          </div>
        )}

        {resolvedSupplements.map((supp) => {
          const taken = takenIds.has(supp.id);
          const subtitle = [
            supp.id === 'creatine' ? `${creatineDose}g` : supp.dose,
            supp.notes,
          ].filter(Boolean).join(' · ');

          return (
            <motion.button
              key={supp.id}
              onClick={() => handleToggle(supp.id)}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left"
              style={{
                background: taken ? AMBER_BG : '#1e293b',
                border: `2px solid ${taken ? AMBER : 'transparent'}`,
              }}
            >
              {/* Left amber accent bar */}
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ background: taken ? AMBER : '#334155', minHeight: 36 }}
              />

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: taken ? 'rgba(245,158,11,0.15)' : '#263347' }}
              >
                {supp.emoji}
              </div>

              {/* Label + subtitle */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold" style={{ color: taken ? '#f1f5f9' : '#94a3b8' }}>
                  {supp.label}
                </p>
                {subtitle && (
                  <p className="text-xs mt-0.5" style={{ color: taken ? AMBER : '#475569' }}>
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Take / Taken button */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-shrink-0"
                style={{
                  background: taken ? AMBER : 'transparent',
                  border: `1.5px solid ${taken ? AMBER : AMBER_BORDER}`,
                }}
              >
                {taken ? (
                  <>
                    <Check size={13} color="black" strokeWidth={3} />
                    <span className="text-xs font-semibold" style={{ color: 'black' }}>Taken</span>
                  </>
                ) : (
                  <span className="text-xs font-semibold" style={{ color: AMBER }}>Take</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Snackbar */}
      <AnimatePresence>
        {snackbar && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-4 right-4 z-50 rounded-xl px-4 py-3 flex items-center justify-center"
            style={{ background: '#1e293b', border: `1px solid ${AMBER_BORDER}` }}
          >
            <span className="text-sm" style={{ color: '#f1f5f9' }}>{snackbar}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past-day confirmation modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => { setConfirmModal(false); setPendingToggleId(null); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-lg rounded-t-3xl p-6 pb-10"
              style={{ background: '#1e293b' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold mb-1" style={{ color: '#f1f5f9' }}>
                Editing a previous day
              </h3>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                You&apos;re updating {dayLabel}. This will modify a previous day&apos;s record.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmModal(false); setPendingToggleId(null); }}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: '#263347', color: '#94a3b8' }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPastDay}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: AMBER, color: 'black' }}
                >
                  Update anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setEditOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-lg rounded-t-3xl pb-safe"
              style={{ background: '#1e293b', maxHeight: '80vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{ background: '#1e293b', borderBottom: '1px solid #263347' }}>
                <h2 className="text-base font-bold" style={{ color: '#f1f5f9' }}>My Supplements</h2>
                <button onClick={() => setEditOpen(false)} className="p-1">
                  <X size={20} color="#64748b" />
                </button>
              </div>

              {/* Current supplements */}
              <div className="px-5 py-4 flex flex-col gap-2">
                {supplementIds.length === 0 && (
                  <p className="text-sm py-2" style={{ color: '#475569' }}>No supplements added yet.</p>
                )}
                {supplementIds.map((id) => {
                  const supp = resolveConfig(id, configs[id]);
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: '#263347' }}
                    >
                      <span className="text-xl">{supp.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{supp.label}</p>
                        {supp.dose && <p className="text-xs" style={{ color: '#64748b' }}>{supp.dose}</p>}
                      </div>
                      {deleteConfirmId === id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded-lg text-xs"
                            style={{ background: '#1e293b', color: '#94a3b8' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRemoveSupplement(id)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: '#ef4444', color: 'white' }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(id)} className="p-1.5">
                          <Trash2 size={16} color="#475569" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add supplement */}
              <div className="px-5 pb-6">
                {!addOpen ? (
                  <button
                    onClick={() => setAddOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
                    style={{ border: `1.5px dashed ${AMBER_BORDER}`, color: AMBER }}
                  >
                    <Plus size={16} />
                    Add supplement
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: '#263347', border: `1px solid ${AMBER_BORDER}` }}>
                    <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Add a supplement</p>

                    {/* Presets not already added */}
                    <div className="flex flex-wrap gap-2">
                      {PRESET_SUPPLEMENTS.filter((p) => !supplementIds.includes(p.id)).map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => { handleAddPreset(preset); setAddOpen(false); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: '#1e293b', color: '#94a3b8' }}
                        >
                          <span>{preset.emoji}</span>
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom */}
                    <div className="flex flex-col gap-2">
                      <p className="text-xs" style={{ color: '#475569' }}>Or add custom:</p>
                      <div className="flex gap-2">
                        <input
                          value={customEmoji}
                          onChange={(e) => setCustomEmoji(e.target.value)}
                          className="w-12 px-2 py-2 rounded-lg text-center text-base"
                          style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' }}
                          maxLength={2}
                        />
                        <input
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="Name"
                          className="flex-1 px-3 py-2 rounded-lg text-sm"
                          style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' }}
                        />
                        <input
                          value={customDose}
                          onChange={(e) => setCustomDose(e.target.value)}
                          placeholder="Dose"
                          className="w-20 px-3 py-2 rounded-lg text-sm"
                          style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' }}
                        />
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setAddOpen(false)}
                          className="flex-1 py-2 rounded-lg text-sm"
                          style={{ background: '#1e293b', color: '#64748b' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddCustom}
                          disabled={!customName.trim()}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold"
                          style={{ background: customName.trim() ? AMBER : '#263347', color: customName.trim() ? 'black' : '#475569' }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed top-4 right-4 z-50">
          <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: AMBER, borderTopColor: 'transparent' }} />
        </div>
      )}
    </div>
  );
}
