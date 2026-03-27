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

async function registerPushSubscription(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return; // Already subscribed

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub }),
    });
  } catch {
    // Service worker not yet active (e.g. dev mode) — silent fail, setTimeout fallback handles it
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function useNotifications(total: number, goal: number) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const totalRef = useRef(total);
  totalRef.current = total;

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied';
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register Web Push subscription for background notifications
      await registerPushSubscription();
    }
    return permission;
  };

  // setTimeout-based fallback — fires while app is open (works in dev too)
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
          icon: '/api/icon?size=192',
        });
      }, ms);
      timersRef.current.push(timer);
    });

    return () => { timersRef.current.forEach(clearTimeout); };
  }, [goal]);

  // Re-register push subscription if permission was already granted on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      registerPushSubscription();
    }
  }, []);

  return { requestPermission };
}
