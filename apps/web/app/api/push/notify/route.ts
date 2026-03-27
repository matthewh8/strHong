import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Notification slots mapped to UTC hours (adjust offsets for your timezone)
const SLOT_BY_HOUR: Record<number, number> = {
  7: 0,
  9: 1,
  12: 2,
  14: 3,
  16: 4,
  18: 5,
};

function getMessage(total: number, goal: number, slot: number): string {
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
  return msgs[slot] ?? msgs[0];
}

export async function POST(request: NextRequest) {
  // Protect cron endpoint — Vercel sets this header automatically
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow direct calls without secret in dev (no CRON_SECRET set)
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const nowHour = new Date().getUTCHours();
  const slotIndex = SLOT_BY_HOUR[nowHour];

  if (slotIndex === undefined) {
    return NextResponse.json({ ok: true, message: 'No notification slot for this hour' });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Fetch all subscriptions
  const { data: subs, error: subsError } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth');

  if (subsError) {
    return NextResponse.json({ error: subsError.message }, { status: 500 });
  }
  if (!subs?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const today = new Date().toISOString().split('T')[0];
  const userIds = [...new Set(subs.map((s) => s.user_id as string))];

  // Fetch today's totals and goals for all users
  const [{ data: logs }, { data: profiles }] = await Promise.all([
    admin
      .from('water_logs')
      .select('user_id, amount')
      .in('user_id', userIds)
      .eq('date', today),
    admin
      .from('user_profiles')
      .select('id, daily_goal')
      .in('id', userIds),
  ]);

  const totalByUser: Record<string, number> = {};
  for (const log of logs ?? []) {
    totalByUser[log.user_id as string] = (totalByUser[log.user_id as string] ?? 0) + (log.amount as number);
  }
  const goalByUser: Record<string, number> = {};
  for (const p of profiles ?? []) {
    goalByUser[p.id as string] = (p.daily_goal as number) ?? 64;
  }

  const expired: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (sub) => {
      const total = totalByUser[sub.user_id as string] ?? 0;
      const goal = goalByUser[sub.user_id as string] ?? 64;

      if (total >= goal) return; // Already met goal, skip

      const body = getMessage(total, goal, slotIndex);

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint as string,
            keys: { p256dh: sub.p256dh as string, auth: sub.auth as string },
          },
          JSON.stringify({ title: 'Hydration Reminder', body }),
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          expired.push(sub.id as string);
        }
      }
    }),
  );

  // Clean up expired subscriptions
  if (expired.length) {
    await admin.from('push_subscriptions').delete().in('id', expired);
  }

  return NextResponse.json({ ok: true, sent, expired: expired.length });
}
