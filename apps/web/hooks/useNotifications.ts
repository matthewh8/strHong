'use client';
import { useEffect, useRef } from 'react';

const SCHEDULE: [number, number][] = [
  [7, 0], [9, 0], [12, 0], [14, 0], [16, 0], [18, 0],
];

function getMessage(total: number, goal: number, slotIndex: number): string {
  const pct = Math.round((total / goal) * 100);
  const remaining = Math.max(0, goal - total);
  const msgs = [
    `Rise and hydrate! Goal: ${goal} oz today`,
    `Morning check: ${total}/${goal} oz logged`,
    pct < 40 ? `Behind pace — only ${total} oz so far` : `Halfway there! ${pct}% done`,
    `Afternoon nudge: ${remaining} oz to go`,
    `Push through: ${pct}% done, ${remaining} oz left`,
    `Final stretch! ${remaining} oz before tonight`,
  ];
  return msgs[slotIndex] ?? msgs[0];
}

export function useNotifications(total: number, goal: number) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const totalRef = useRef(total);
  totalRef.current = total;

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied';
    return Notification.requestPermission();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const now = new Date();
    SCHEDULE.forEach(([hour, minute], i) => {
      const target = new Date(now);
      target.setHours(hour, minute, 0, 0);
      const ms = target.getTime() - now.getTime();
      if (ms <= 0) return;
      const timer = setTimeout(() => {
        if (totalRef.current >= goal) return;
        new Notification('Hydration Reminder', {
          body: getMessage(totalRef.current, goal, i),
          icon: '/icon-192.png',
        });
      }, ms);
      timersRef.current.push(timer);
    });

    return () => { timersRef.current.forEach(clearTimeout); };
  }, [goal]);

  return { requestPermission };
}
