-- ═══════════════════════════════════════════════════════════════════════════
-- RLS hardening for kcal2's user-owned tables
-- ═══════════════════════════════════════════════════════════════════════════
--
-- WHAT THIS DOES
-- rls_hardening.sql already locks down the three shared read-only tables
-- (global_foods, robot_messages, insight_texts). create_water_log_table.sql
-- sets up RLS for water_log. But the app's other five user-owned tables —
-- ledger, custom_foods, custom_meal_configs, weight_log, user_settings —
-- have no checked-in RLS script. Their policies may already be configured
-- correctly by hand in the Supabase dashboard, or they may not be — that
-- can't be verified from the client-side code in this repo, only from the
-- live database. This script makes the correct state explicit and
-- re-runnable rather than assumed.
--
-- WHY THIS MATTERS
-- If any of these five tables is missing RLS (or has it enabled but with no
-- policies, which — since Postgres RLS defaults to deny-all — would just
-- break the app rather than leak data, but is worth ruling out either way),
-- every request from the client goes through the public anon/authenticated
-- key embedded in the shipped bundle. Without a `user_id = auth.uid()`
-- policy, any signed-in user could read or write any OTHER user's food log,
-- weight history, custom foods, custom meal names, or profile/goal settings
-- via that same key. This is the highest-stakes check in the app's security
-- posture — everything else (CSP, input handling, etc.) is secondary to it.
--
-- HOW TO APPLY
-- Paste into the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- for this project and run it. I cannot run this against your live database
-- from here. Safe to run even if these tables are already correctly
-- policied — it only enables RLS (a no-op if already on) and replaces these
-- specific named policies.
--
-- SCOPE
-- This only adds/replaces RLS policies. It does not create these tables
-- (they already exist) or touch their columns/constraints.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

alter table if exists public.ledger enable row level security;
alter table if exists public.custom_foods enable row level security;
alter table if exists public.custom_meal_configs enable row level security;
alter table if exists public.weight_log enable row level security;
alter table if exists public.user_settings enable row level security;

-- Drop any pre-existing policies with these names so this script is
-- re-runnable without erroring on conflict.
drop policy if exists "ledger_select_own" on public.ledger;
drop policy if exists "ledger_insert_own" on public.ledger;
drop policy if exists "ledger_update_own" on public.ledger;
drop policy if exists "ledger_delete_own" on public.ledger;

drop policy if exists "custom_foods_select_own" on public.custom_foods;
drop policy if exists "custom_foods_insert_own" on public.custom_foods;
drop policy if exists "custom_foods_update_own" on public.custom_foods;
drop policy if exists "custom_foods_delete_own" on public.custom_foods;

drop policy if exists "custom_meal_configs_select_own" on public.custom_meal_configs;
drop policy if exists "custom_meal_configs_insert_own" on public.custom_meal_configs;
drop policy if exists "custom_meal_configs_update_own" on public.custom_meal_configs;
drop policy if exists "custom_meal_configs_delete_own" on public.custom_meal_configs;

drop policy if exists "weight_log_select_own" on public.weight_log;
drop policy if exists "weight_log_insert_own" on public.weight_log;
drop policy if exists "weight_log_update_own" on public.weight_log;
drop policy if exists "weight_log_delete_own" on public.weight_log;

drop policy if exists "user_settings_select_own" on public.user_settings;
drop policy if exists "user_settings_insert_own" on public.user_settings;
drop policy if exists "user_settings_update_own" on public.user_settings;
drop policy if exists "user_settings_delete_own" on public.user_settings;

-- ── ledger: one row per (user_id, date) — the daily food log ──
create policy "ledger_select_own" on public.ledger for select to authenticated using (auth.uid() = user_id);
create policy "ledger_insert_own" on public.ledger for insert to authenticated with check (auth.uid() = user_id);
create policy "ledger_update_own" on public.ledger for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ledger_delete_own" on public.ledger for delete to authenticated using (auth.uid() = user_id);

-- ── custom_foods: user-created food entries ──
create policy "custom_foods_select_own" on public.custom_foods for select to authenticated using (auth.uid() = user_id);
create policy "custom_foods_insert_own" on public.custom_foods for insert to authenticated with check (auth.uid() = user_id);
create policy "custom_foods_update_own" on public.custom_foods for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custom_foods_delete_own" on public.custom_foods for delete to authenticated using (auth.uid() = user_id);

-- ── custom_meal_configs: user-created meal slots (e.g. "Pre-Workout") ──
create policy "custom_meal_configs_select_own" on public.custom_meal_configs for select to authenticated using (auth.uid() = user_id);
create policy "custom_meal_configs_insert_own" on public.custom_meal_configs for insert to authenticated with check (auth.uid() = user_id);
create policy "custom_meal_configs_update_own" on public.custom_meal_configs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custom_meal_configs_delete_own" on public.custom_meal_configs for delete to authenticated using (auth.uid() = user_id);

-- ── weight_log: one row per (user_id, date) — weigh-in history ──
create policy "weight_log_select_own" on public.weight_log for select to authenticated using (auth.uid() = user_id);
create policy "weight_log_insert_own" on public.weight_log for insert to authenticated with check (auth.uid() = user_id);
create policy "weight_log_update_own" on public.weight_log for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weight_log_delete_own" on public.weight_log for delete to authenticated using (auth.uid() = user_id);

-- ── user_settings: one row per user_id — profile, goal, theme, etc. ──
create policy "user_settings_select_own" on public.user_settings for select to authenticated using (auth.uid() = user_id);
create policy "user_settings_insert_own" on public.user_settings for insert to authenticated with check (auth.uid() = user_id);
create policy "user_settings_update_own" on public.user_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_settings_delete_own" on public.user_settings for delete to authenticated using (auth.uid() = user_id);

commit;

-- ── Verification ──
-- After running, confirm RLS is enabled and only the expected policies exist:
--   select relname, relrowsecurity from pg_class
--     where relname in ('ledger','custom_foods','custom_meal_configs','weight_log','user_settings');
--   select tablename, policyname, roles, cmd from pg_policies
--     where tablename in ('ledger','custom_foods','custom_meal_configs','weight_log','user_settings');
--
-- Also worth testing directly: sign in as two different accounts in the app
-- and confirm neither can see the other's food log, weight history, or
-- custom foods/meals — the strongest confirmation RLS is actually working,
-- not just present.
