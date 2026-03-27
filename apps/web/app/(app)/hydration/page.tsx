'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/storage';
import { useHydration } from '@/hooks/useHydration';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDate } from '@/lib/calculations';
import RunnaCalendar from '@/components/hydration/RunnaCalendar';
import TotalDisplay from '@/components/hydration/TotalDisplay';
import ActionCircles from '@/components/hydration/ActionCircles';
import ConsumptionLog from '@/components/hydration/ConsumptionLog';

export default function HydrationPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<ReturnType<typeof getProfile>>(null);
  const [calendarData, setCalendarData] = useState<Record<string, number>>({});
  const [confirmModal, setConfirmModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  const {
    today,
    selectedDate,
    logs,
    total,
    canUndo,
    canRedo,
    handleIncrement,
    handleUndo,
    handleRedo,
    handleDeleteLog,
    handleDateChange,
    getDailyTotals,
  } = useHydration(user?.id);

  const dailyGoal = profile?.dailyGoal ?? 64;
  const bottleSize = profile?.bottleSize ?? 24;
  const isCurrentDay = selectedDate === today;

  const { requestPermission } = useNotifications(total, dailyGoal);

  // Load profile client-side only (avoids SSR/client hydration mismatch)
  useEffect(() => {
    setProfile(getProfile());
  }, []);

  // Show notification banner if permission not yet decided
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setShowNotifBanner(Notification.permission === 'default');
    }
  }, []);

  // Redirect to login if not authenticated (wait for session to load first)
  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Load calendar data on mount
  useEffect(() => {
    const dates: string[] = [];
    for (let i = -7; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(formatDate(d));
    }
    getDailyTotals(dates).then(setCalendarData);
  }, [getDailyTotals]);

  // Refresh calendar data after log changes
  useEffect(() => {
    setCalendarData((prev) => ({
      ...prev,
      [selectedDate]: total,
    }));
  }, [total, selectedDate]);

  const handleConfirmEdit = () => {
    setConfirmModal(false);
    if (pendingAmount !== null) {
      handleIncrement(pendingAmount);
      setPendingAmount(null);
    }
  };

  const handleActionTap = (amount: number) => {
    if (!isCurrentDay) {
      setPendingAmount(amount);
      setConfirmModal(true);
    } else {
      handleIncrement(amount);
    }
  };

  const handleAllowNotifications = async () => {
    const perm = await requestPermission();
    if (perm !== 'default') setShowNotifBanner(false);
  };

  return (
    <div className="flex flex-col" style={{ background: '#0f172a' }}>
      {/* Notification permission banner */}
      {showNotifBanner && (
        <div
          className="flex items-center justify-between px-4 py-3 mx-4 mt-3 rounded-2xl"
          style={{ background: '#1e293b' }}
        >
          <span className="text-sm" style={{ color: '#94a3b8' }}>
            Enable reminders to stay on track
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAllowNotifications}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#0096FF', color: 'white' }}
            >
              Allow
            </button>
            <button
              onClick={() => setShowNotifBanner(false)}
              className="text-xs"
              style={{ color: '#475569' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Calendar */}
      <RunnaCalendar
        selectedDate={selectedDate}
        data={calendarData}
        dailyGoal={dailyGoal}
        onDateSelect={handleDateChange}
      />

      <div
        className="mx-4 h-px"
        style={{ background: 'rgba(51, 65, 85, 0.5)' }}
      />

      {/* Total + undo/redo */}
      <TotalDisplay
        total={total}
        dailyGoal={dailyGoal}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Action circles */}
      <ActionCircles
        bottleSize={bottleSize}
        isCurrentDay={isCurrentDay}
        onIncrement={handleActionTap}
      />

      {/* History divider */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-2">
        <div className="flex-1 h-px" style={{ background: 'rgba(51, 65, 85, 0.5)' }} />
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#334155' }}>
          History
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(51, 65, 85, 0.5)' }} />
      </div>

      {/* Log */}
      <ConsumptionLog logs={logs} onDelete={handleDeleteLog} />

      {/* Past-day confirm modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setConfirmModal(false)}
        >
          <div
            className="w-full max-w-[340px] rounded-3xl px-6 pt-6 pb-8"
            style={{ background: '#1e293b' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#f1f5f9' }}>
              Editing a past day
            </h2>
            <p className="text-sm mb-6" style={{ color: '#64748b' }}>
              You are editing a previous day. Continue?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: '#263347', color: '#94a3b8' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEdit}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: '#0096FF', color: 'white' }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
