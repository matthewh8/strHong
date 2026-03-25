-- Add ON DELETE CASCADE to auth.users foreign keys
-- so deleting a user also cleans up their profile and logs

alter table user_profiles drop constraint user_profiles_id_fkey;
alter table user_profiles add constraint user_profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;

alter table water_logs drop constraint water_logs_user_id_fkey;
alter table water_logs add constraint water_logs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
