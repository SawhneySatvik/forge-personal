-- Forge — 0001_init.sql
-- Extensions, enums, tables, indexes, and the updated_at trigger.
-- Run this first in the Supabase SQL editor.

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------- Enums (guarded so re-running is safe) ----------
do $$ begin
  create type difficulty_level as enum ('Easy', 'Medium', 'Hard');
exception when duplicate_object then null; end $$;

do $$ begin
  create type challenge_status as enum ('Planned', 'Active', 'Completed', 'Abandoned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym_status as enum ('went', 'rest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum ('Active', 'Shipped', 'Paused', 'Killed');
exception when duplicate_object then null; end $$;

-- ---------- updated_at helper ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles (one row for the single user) ----------
create table if not exists profiles (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  display_name      text,
  timezone          text not null default 'Asia/Kolkata',
  github_username   text,
  leetcode_username text,
  linkedin_url      text,
  x_handle          text,
  settings          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ---------- challenges (generalized, data-driven) ----------
create table if not exists challenges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  start_date  date,
  end_date    date,
  status      challenge_status not null default 'Planned',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_challenges_updated_at on challenges;
create trigger trg_challenges_updated_at before update on challenges
  for each row execute function set_updated_at();
create index if not exists idx_challenges_user_status on challenges(user_id, status);

-- ---------- challenge_phases (ordered; topics as an array) ----------
create table if not exists challenge_phases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  challenge_id  uuid not null references challenges(id) on delete cascade,
  name          text not null,
  duration_days integer not null default 0 check (duration_days >= 0),
  sort_order    integer not null default 0,
  topics        text[] not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists idx_phases_challenge on challenge_phases(challenge_id, sort_order);
create index if not exists idx_phases_user on challenge_phases(user_id);

-- ---------- dsa_problems ----------
create table if not exists dsa_problems (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  topic        text,
  difficulty   difficulty_level,
  solved       boolean not null default false,
  notes        text,
  date         date not null,
  source_label text,
  problem_url  text,
  challenge_id uuid references challenges(id) on delete set null,
  phase_id     uuid references challenge_phases(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists trg_dsa_updated_at on dsa_problems;
create trigger trg_dsa_updated_at before update on dsa_problems
  for each row execute function set_updated_at();
create index if not exists idx_dsa_user_date on dsa_problems(user_id, date desc);
create index if not exists idx_dsa_user_topic on dsa_problems(user_id, topic);

-- ---------- system_design_topics ----------
create table if not exists system_design_topics (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  covered    boolean not null default false,
  covered_at timestamptz,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_sysdesign_updated_at on system_design_topics;
create trigger trg_sysdesign_updated_at before update on system_design_topics
  for each row execute function set_updated_at();
create index if not exists idx_sysdesign_user on system_design_topics(user_id);

-- ---------- daily_logs (one wide row per day; source of truth for streaks) ----------
create table if not exists daily_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  date               date not null,
  dsa_done           boolean not null default false,
  gym_status         gym_status,                 -- null = no entry = streak break
  system_design_done boolean not null default false,
  posted_x           boolean not null default false,
  posted_linkedin    boolean not null default false,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, date)
);
drop trigger if exists trg_daily_updated_at on daily_logs;
create trigger trg_daily_updated_at before update on daily_logs
  for each row execute function set_updated_at();
create index if not exists idx_daily_user_date on daily_logs(user_id, date desc);

-- ---------- side_projects ----------
create table if not exists side_projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  status      project_status not null default 'Active',
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_projects_updated_at on side_projects;
create trigger trg_projects_updated_at before update on side_projects
  for each row execute function set_updated_at();
create index if not exists idx_projects_user_status on side_projects(user_id, status);
create index if not exists idx_projects_tags on side_projects using gin (tags);

-- ---------- project_milestones (ordered, dated) ----------
create table if not exists project_milestones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references side_projects(id) on delete cascade,
  date       date not null,
  note       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_milestones_project on project_milestones(project_id, date desc, sort_order);
create index if not exists idx_milestones_user on project_milestones(user_id);

-- ---------- profile_snapshots (cache for GitHub / LeetCode) ----------
create table if not exists profile_snapshots (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  source     text not null,             -- 'github' | 'leetcode'
  fetched_at timestamptz not null default now(),
  payload    jsonb not null default '{}'::jsonb
);
create index if not exists idx_snapshots_user_source on profile_snapshots(user_id, source, fetched_at desc);
