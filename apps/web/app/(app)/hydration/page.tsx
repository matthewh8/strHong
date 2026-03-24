'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isFirstTimeUser, getProfile } from '@/lib/storage';
import { useHydration } from '@/hooks/useHydration';
import { formatDate } from '@/lib/calculations';
import RunnaCalendar from '@/components/hydration/RunnaCalendar';
import TotalDisplay from '@/components/hydration/TotalDisplay';
import ActionCircles from '@/components/hydration/ActionCircles';
import ConsumptionLog from '@/components/hydration/ConsumptionLog';

export default function HydrationPage() {
  const router = useRouter();
  const profile = getProfile();
  const [calendarData, setCalendarData] = useState<Record<string, number>>({});
  const [confirmModal, setConfirmModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

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
  } = useHydration();

  const dailyGoal = profile?.dailyGoal ?? 64;
  const bottleSize = profile?.bottleSize ?? 24;
  const isCurrentDay = selectedDate === today;

  // Redirect to onboarding if needed
  useEffect(() => {
    if (isFirstTimeUser()) {
      router.replace('/onboarding');
    }
  }, [router]);

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

  const handlePastDayTap = () => setConfirmModal(true);

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

  return (
    <div className="flex flex-col h-full" style={{ background: '#0f172a' }}>
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
        onPastDayTap={handlePastDayTap}
      />

      {/* Log */}
      <ConsumptionLog logs={logs} onDelete={handleDeleteLog} />

      {/* Past-day confirm modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setConfirmModal(false)}
        >
          <div
            className="w-full max-w-[480px] rounded-t-3xl px-6 pt-6 pb-10"
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
                style={{ background: '#3b82f6', color: 'white' }}
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
