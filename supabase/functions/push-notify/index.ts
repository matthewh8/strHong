// Supabase Edge Function — Deno runtime
// Sends Web Push notifications to users who haven't logged water in 3+ hours
// Called hourly by pg_cron via pg_net

import webpush from 'npm:web-push@3';
import { createClient } from 'npm:@supabase/supabase-js@2';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

interface PushSub {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT');

  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), { status: 500 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const admin = createClient(supabaseUrl, serviceKey);
  const threeHoursAgo = new Date(Date.now() - THREE_HOURS_MS).toISOString();
  const today = new Date().toISOString().split('T')[0];

  // Subscriptions not notified in the last 3h
  const { data: subs, error: subsErr } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .or(`last_notified_at.is.null,last_notified_at.lt.${threeHoursAgo}`);

  if (subsErr || !subs?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 });
  }

  const userIds = [...new Set((subs as PushSub[]).map((s) => s.user_id))];

  // Fetch today's water logs + user goals for all relevant users
  const [{ data: logs }, { data: profiles }] = await Promise.all([
    admin
      .from('water_logs')
      .select('user_id, amount, logged_at')
      .in('user_id', userIds)
      .eq('date', today)
      .order('logged_at', { ascending: false }),
    admin
      .from('user_profiles')
      .select('id, daily_goal')
      .in('id', userIds),
  ]);

  // Compute per-user: total today + last log time
  const totalByUser: Record<string, number> = {};
  const lastLogByUser: Record<string, string | null> = {};
  for (const log of (logs ?? []) as { user_id: string; amount: number; logged_at: string }[]) {
    totalByUser[log.user_id] = (totalByUser[log.user_id] ?? 0) + log.amount;
    if (!lastLogByUser[log.user_id]) lastLogByUser[log.user_id] = log.logged_at;
  }

  const goalByUser: Record<string, number> = {};
  for (const p of (profiles ?? []) as { id: string; daily_goal: number }[]) {
    goalByUser[p.id] = p.daily_goal ?? 64;
  }

  const expired: string[] = [];
  const notified: string[] = [];
  let sent = 0;

  await Promise.all(
    (subs as PushSub[]).map(async (sub) => {
      const total  = totalByUser[sub.user_id] ?? 0;
      const goal   = goalByUser[sub.user_id] ?? 64;
      const lastLog = lastLogByUser[sub.user_id] ?? null;

      // Skip if within 5 oz of goal or already over
      if (total >= goal - 5) return;

      // Skip if logged water within the last 3 hours
      if (lastLog && new Date(lastLog).getTime() > Date.now() - THREE_HOURS_MS) return;

      const remaining = Math.max(0, goal - total);
      const body = lastLog
        ? `No water logged in 3+ hours — ${remaining} oz left to reach your goal`
        : `Haven't logged any water today — ${goal} oz goal awaits!`;

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: 'Hydration Reminder', body }),
        );
        notified.push(sub.id);
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) expired.push(sub.id);
      }
    }),
  );

  // Update last_notified_at for sent subscriptions
  if (notified.length) {
    await admin
      .from('push_subscriptions')
      .update({ last_notified_at: new Date().toISOString() })
      .in('id', notified);
  }

  // Remove expired subscriptions
  if (expired.length) {
    await admin.from('push_subscriptions').delete().in('id', expired);
  }

  return new Response(
    JSON.stringify({ ok: true, sent, expired: expired.length }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
