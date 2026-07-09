-- ═══════════════════════════════════════════════════════════════════════════
-- RLS hardening for kcal2's shared reference tables
-- ═══════════════════════════════════════════════════════════════════════════
--
-- WHAT THIS DOES
-- global_foods, robot_messages, and insight_texts are shared content tables
-- that every signed-in user reads (via the public anon/authenticated key
-- shipped in the client bundle) but that the app itself never needs to
-- write to at runtime — they're only populated by the one-off seed scripts
-- in scripts/seedSupabase.js and scripts/migrateFullData.js.
--
-- Today, if these tables don't already have write-restricting RLS policies,
-- ANY client holding the public anon key (i.e. anyone who's loaded the app)
-- could INSERT/UPDATE/DELETE rows in them — vandalizing shared food data,
-- robot messages, or insight copy for every user. This migration locks that
-- down: read access stays open, writes are restricted to the service role.
--
-- HOW TO APPLY
-- This repo has no existing migrations folder/tooling, so this is a plain
-- SQL script, not a CLI-managed migration. I cannot run this against your
-- live database from here — paste it into the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query) for your project and run it, or
-- apply it via `supabase db execute` / `psql` if you manage schema that way.
--
-- AFTER APPLYING
-- scripts/seedSupabase.js and scripts/migrateFullData.js currently connect
-- with VITE_SUPABASE_ANON_KEY (see their .env.local usage) — once this is
-- applied, the anon key can no longer write to these tables, so re-seeding
-- must be done with the project's service_role key instead (Project
-- Settings → API → service_role secret). Never ship the service_role key
-- in the frontend bundle or commit it to source control.
--
-- This does NOT touch RLS on user-owned tables (ledger, custom_foods,
-- custom_meal_configs, water_log, weight_log, user_settings) — those
-- should already be scoped with `auth.uid() = user_id` policies; verify
-- that separately if you haven't already.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

alter table if exists public.global_foods enable row level security;
alter table if exists public.robot_messages enable row level security;
alter table if exists public.insight_texts enable row level security;

-- Drop any pre-existing policies with these names so this script is
-- re-runnable without erroring on conflict.
drop policy if exists "global_foods_read_all" on public.global_foods;
drop policy if exists "global_foods_service_write" on public.global_foods;
drop policy if exists "robot_messages_read_all" on public.robot_messages;
drop policy if exists "robot_messages_service_write" on public.robot_messages;
drop policy if exists "insight_texts_read_all" on public.insight_texts;
drop policy if exists "insight_texts_service_write" on public.insight_texts;

-- ── global_foods: readable by anyone (incl. anon), writable only by the
--    service role (used by the seed scripts, never by the shipped app). ──
create policy "global_foods_read_all"
  on public.global_foods for select
  to anon, authenticated
  using (true);

create policy "global_foods_service_write"
  on public.global_foods for all
  to service_role
  using (true)
  with check (true);

-- ── robot_messages: same shape. ──
create policy "robot_messages_read_all"
  on public.robot_messages for select
  to anon, authenticated
  using (true);

create policy "robot_messages_service_write"
  on public.robot_messages for all
  to service_role
  using (true)
  with check (true);

-- ── insight_texts: same shape. ──
create policy "insight_texts_read_all"
  on public.insight_texts for select
  to anon, authenticated
  using (true);

create policy "insight_texts_service_write"
  on public.insight_texts for all
  to service_role
  using (true)
  with check (true);

commit;

-- ── Verification ──
-- After running, confirm RLS is enabled and only the expected policies exist:
--   select relname, relrowsecurity from pg_class
--     where relname in ('global_foods','robot_messages','insight_texts');
--   select tablename, policyname, roles, cmd from pg_policies
--     where tablename in ('global_foods','robot_messages','insight_texts');
