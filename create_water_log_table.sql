-- ═══════════════════════════════════════════════════════════════════════════
-- Creates the missing `water_log` table
-- ═══════════════════════════════════════════════════════════════════════════
--
-- WHY: useWaterStore.js (hydrateWater / _flushSyncs) reads and writes
-- `water_log` rows shaped { user_id, date, glasses, ml }, one row per user
-- per day, upserted on (user_id, date). Every other table the app expects
-- (ledger, custom_foods, custom_meal_configs, weight_log, user_settings,
-- global_foods, robot_messages, insight_texts) already exists in this
-- project — only this one is missing, which is why water logging throws
-- PGRST205 "Could not find the table 'public.water_log'".
--
-- HOW TO APPLY: paste into the Supabase SQL Editor (Dashboard → SQL Editor
-- → New query) for this project and run it. I can't reach your live
-- database from here.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create table if not exists public.water_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  glasses integer not null default 0,
  ml integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.water_log enable row level security;

drop policy if exists "water_log_select_own" on public.water_log;
drop policy if exists "water_log_insert_own" on public.water_log;
drop policy if exists "water_log_update_own" on public.water_log;
drop policy if exists "water_log_delete_own" on public.water_log;

create policy "water_log_select_own"
  on public.water_log for select
  to authenticated
  using (auth.uid() = user_id);

create policy "water_log_insert_own"
  on public.water_log for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "water_log_update_own"
  on public.water_log for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "water_log_delete_own"
  on public.water_log for delete
  to authenticated
  using (auth.uid() = user_id);

commit;

-- ── Verification ──
--   select * from public.water_log limit 1;
--   select tablename, policyname, roles, cmd from pg_policies where tablename = 'water_log';
