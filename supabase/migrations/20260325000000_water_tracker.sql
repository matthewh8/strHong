-- User profiles (replaces localStorage)
create table if not exists user_profiles (
  id uuid references auth.users primary key,
  age int,
  height_ft int,
  height_in int,
  weight numeric,
  gender text,
  activity_level int,
  supplements text[] default '{}',
  bottle_size numeric,
  unit text,
  daily_goal numeric,
  updated_at timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "own profile" on user_profiles
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Water logs (replaces Dexie/IndexedDB)
create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date text not null,
  amount numeric not null,
  logged_at timestamptz default now()
);

alter table water_logs enable row level security;

create policy "own logs" on water_logs
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists water_logs_user_date on water_logs (user_id, date);
