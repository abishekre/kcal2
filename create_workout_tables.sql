-- ═══════════════════════════════════════════════════════════════════════════
-- Workout tracking tables: workout_sessions, custom_exercises, workout_routines
-- ═══════════════════════════════════════════════════════════════════════════
--
-- WHY: the workout tracker (useWorkoutStore / useExerciseStore) reads and
-- writes these three tables. Same conventions as the rest of the app:
-- one jsonb payload per row, upserted by the client, RLS scoped to
-- auth.uid() = user_id on every command.
--
-- HOW TO APPLY: paste into the Supabase SQL Editor (Dashboard → SQL Editor →
-- New query) for the kcal project and run it. Re-runnable (IF NOT EXISTS /
-- drop-then-create policies).
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── workout_sessions: one row per finished workout ──
create table if not exists public.workout_sessions (
  id uuid primary key,                      -- client-generated (crypto.randomUUID)
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  name text,
  started_at timestamptz,
  ended_at timestamptz,
  entries jsonb not null default '[]'::jsonb,
  calories_burned integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workout_sessions_user_date_idx
  on public.workout_sessions (user_id, date);

-- ── custom_exercises: user-created exercises ──
create table if not exists public.custom_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_key text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, exercise_key)
);

-- ── workout_routines: saved workout templates ──
create table if not exists public.workout_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id text not null,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, routine_id)
);

-- ── RLS: own-rows only, on every command ──
alter table public.workout_sessions enable row level security;
alter table public.custom_exercises enable row level security;
alter table public.workout_routines enable row level security;

drop policy if exists "workout_sessions_select_own" on public.workout_sessions;
drop policy if exists "workout_sessions_insert_own" on public.workout_sessions;
drop policy if exists "workout_sessions_update_own" on public.workout_sessions;
drop policy if exists "workout_sessions_delete_own" on public.workout_sessions;
create policy "workout_sessions_select_own" on public.workout_sessions for select to authenticated using (auth.uid() = user_id);
create policy "workout_sessions_insert_own" on public.workout_sessions for insert to authenticated with check (auth.uid() = user_id);
create policy "workout_sessions_update_own" on public.workout_sessions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_sessions_delete_own" on public.workout_sessions for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "custom_exercises_select_own" on public.custom_exercises;
drop policy if exists "custom_exercises_insert_own" on public.custom_exercises;
drop policy if exists "custom_exercises_update_own" on public.custom_exercises;
drop policy if exists "custom_exercises_delete_own" on public.custom_exercises;
create policy "custom_exercises_select_own" on public.custom_exercises for select to authenticated using (auth.uid() = user_id);
create policy "custom_exercises_insert_own" on public.custom_exercises for insert to authenticated with check (auth.uid() = user_id);
create policy "custom_exercises_update_own" on public.custom_exercises for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custom_exercises_delete_own" on public.custom_exercises for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "workout_routines_select_own" on public.workout_routines;
drop policy if exists "workout_routines_insert_own" on public.workout_routines;
drop policy if exists "workout_routines_update_own" on public.workout_routines;
drop policy if exists "workout_routines_delete_own" on public.workout_routines;
create policy "workout_routines_select_own" on public.workout_routines for select to authenticated using (auth.uid() = user_id);
create policy "workout_routines_insert_own" on public.workout_routines for insert to authenticated with check (auth.uid() = user_id);
create policy "workout_routines_update_own" on public.workout_routines for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_routines_delete_own" on public.workout_routines for delete to authenticated using (auth.uid() = user_id);

commit;

-- ── Verification ──
--   select relname, relrowsecurity from pg_class
--     where relname in ('workout_sessions','custom_exercises','workout_routines');
--   select tablename, policyname, cmd from pg_policies
--     where tablename in ('workout_sessions','custom_exercises','workout_routines');
