-- Track when we last sent a push to each subscription (for 3h dedup)
alter table push_subscriptions
  add column if not exists last_notified_at timestamptz;
