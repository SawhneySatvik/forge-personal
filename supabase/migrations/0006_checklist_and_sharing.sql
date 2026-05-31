-- Forge — 0006_checklist_and_sharing.sql
-- Adds: checklist-kind challenges + a canonical question/item table
-- (challenge_items), public-sharing flags, and anon read policies for the
-- public profile/challenge pages. Pure DDL — run unauthenticated, AFTER 0001/0002
-- (and ideally after 0005). Idempotent.

-- ---------- challenges: kind + public flag ----------
alter table challenges
  add column if not exists kind text not null default 'cadence'
    check (kind in ('cadence', 'checklist'));
alter table challenges
  add column if not exists is_public boolean not null default false;

-- ---------- profiles: public face fields ----------
alter table profiles add column if not exists public_handle text;
alter table profiles add column if not exists is_public boolean not null default false;
alter table profiles add column if not exists public_bio text;
-- one handle per user, case-insensitive; nulls allowed (not yet public)
create unique index if not exists idx_profiles_public_handle
  on profiles (lower(public_handle)) where public_handle is not null;

-- ---------- challenge_items (canonical questions for checklist challenges) ----------
create table if not exists challenge_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references challenges(id) on delete cascade,
  section      text not null default '',          -- grouping label (the 27 SDE topics)
  sort_order   integer not null default 0,         -- global 1..N order
  title        text not null,
  difficulty   difficulty_level,
  url          text,
  source       text,                               -- 'leetcode' | 'geeksforgeeks' | 'interviewbit' | 'codingninjas'
  external_ref text,                               -- leetcode titleSlug (nullable)
  done         boolean not null default false,
  done_date    date,                               -- the DayKey it was marked done
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists trg_challenge_items_updated_at on challenge_items;
create trigger trg_challenge_items_updated_at before update on challenge_items
  for each row execute function set_updated_at();
create index if not exists idx_challenge_items_challenge
  on challenge_items(challenge_id, sort_order);
create index if not exists idx_challenge_items_user_done
  on challenge_items(user_id, done);
create index if not exists idx_challenge_items_done_date
  on challenge_items(user_id, done_date) where done_date is not null;

-- ---------- RLS: owner-only (mirrors 0002/0005) ----------
alter table challenge_items enable row level security;
alter table challenge_items force row level security;

drop policy if exists challenge_items_select on challenge_items;
drop policy if exists challenge_items_insert on challenge_items;
drop policy if exists challenge_items_update on challenge_items;
drop policy if exists challenge_items_delete on challenge_items;

create policy challenge_items_select on challenge_items
  for select to authenticated using (auth.uid() = user_id);
create policy challenge_items_insert on challenge_items
  for insert to authenticated with check (auth.uid() = user_id);
create policy challenge_items_update on challenge_items
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy challenge_items_delete on challenge_items
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- Anon read policies (additive; for the public pages only) ----------
-- These are deny-by-default and scoped to is_public rows. The existing
-- owner-only policies (to authenticated) are untouched. We intentionally do NOT
-- expose daily_logs, dsa_problems or profile_snapshots to anon.

drop policy if exists challenges_public_select on challenges;
create policy challenges_public_select on challenges
  for select to anon using (is_public = true);

drop policy if exists profiles_public_select on profiles;
create policy profiles_public_select on profiles
  for select to anon using (is_public = true);

drop policy if exists challenge_items_public_select on challenge_items;
create policy challenge_items_public_select on challenge_items
  for select to anon using (
    exists (select 1 from challenges c where c.id = challenge_items.challenge_id and c.is_public)
  );

drop policy if exists challenge_logs_public_select on challenge_logs;
create policy challenge_logs_public_select on challenge_logs
  for select to anon using (
    exists (select 1 from challenges c where c.id = challenge_logs.challenge_id and c.is_public)
  );

drop policy if exists challenge_phases_public_select on challenge_phases;
create policy challenge_phases_public_select on challenge_phases
  for select to anon using (
    exists (select 1 from challenges c where c.id = challenge_phases.challenge_id and c.is_public)
  );
