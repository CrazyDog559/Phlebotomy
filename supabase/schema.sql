-- ============================================================
-- Phlebotomy Prep — Supabase schema
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- ============================================================

-- 1) PURCHASES: one row per test a user has unlocked ('all' = bundle).
create table if not exists public.purchases (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  test_id     text not null,                    -- e.g. 'cpt2' or 'all'
  amount_cents integer,
  stripe_session_id text,
  created_at  timestamptz not null default now(),
  unique (user_id, test_id)
);

alter table public.purchases enable row level security;

-- Users may READ their own purchases. (Inserts happen only via the webhook using the service role,
-- which bypasses RLS, so no insert policy is granted to normal users.)
drop policy if exists "read own purchases" on public.purchases;
create policy "read own purchases"
  on public.purchases for select
  using (auth.uid() = user_id);

-- 2) PROGRESS: per-question state so users can resume and see prior guesses.
create table if not exists public.progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  test_id     text not null,
  question_n  integer not null,
  selected    text,                  -- 'A'|'B'|'C'|'D' or null
  confidence  text,                  -- 'know' | 'unsure' | null
  is_correct  boolean,
  updated_at  timestamptz not null default now(),
  unique (user_id, test_id, question_n)
);

alter table public.progress enable row level security;

drop policy if exists "read own progress" on public.progress;
create policy "read own progress"
  on public.progress for select
  using (auth.uid() = user_id);

drop policy if exists "insert own progress" on public.progress;
create policy "insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own progress" on public.progress;
create policy "update own progress"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own progress" on public.progress;
create policy "delete own progress"
  on public.progress for delete
  using (auth.uid() = user_id);

create index if not exists progress_user_test_idx
  on public.progress (user_id, test_id);
