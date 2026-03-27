-- Enable extensions needed for scheduled Edge Function calls.
-- The actual cron schedule is set once via Supabase Studio or CLI
-- (not in this file, to keep the service_role_key out of git).
--
-- After running this migration, run the following in Supabase Studio SQL editor:
--
--   SELECT cron.schedule(
--     'push-3h-inactivity',
--     '0 * * * *',
--     $$
--     SELECT net.http_post(
--       url     := 'https://<project-ref>.supabase.co/functions/v1/push-notify',
--       headers := '{"Content-Type":"application/json","Authorization":"Bearer <service_role_key>"}'::jsonb,
--       body    := '{}'::jsonb
--     );
--     $$
--   );

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;
