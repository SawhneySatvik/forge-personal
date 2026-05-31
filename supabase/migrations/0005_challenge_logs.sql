-- Forge — 0005_challenge_logs.sql
-- Per-challenge daily check-ins → each challenge gets its own heatmap, daily
-- streak and completion %. Run AFTER 0001/0002 (first/unauth batch; no auth.uid()).
-- RLS enabled + owner-only policies (mirrors 0002).

create table if not exists challenge_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references challenges(id) on delete cascade,
  date         date not null,
  done         boolean not null default true,
  note         text,
  created_at   timestamptz not null default now(),
  unique (user_id, challenge_id, date)
);
create index if not exists idx_challenge_logs_user_challenge_date
  on challenge_logs(user_id, challenge_id, date desc);

alter table challenge_logs enable row level security;
alter table challenge_logs force row level security;

drop policy if exists challenge_logs_select on challenge_logs;
drop policy if exists challenge_logs_insert on challenge_logs;
drop policy if exists challenge_logs_update on challenge_logs;
drop policy if exists challenge_logs_delete on challenge_logs;

create policy challenge_logs_select on challenge_logs
  for select to authenticated using (auth.uid() = user_id);
create policy challenge_logs_insert on challenge_logs
  for insert to authenticated with check (auth.uid() = user_id);
create policy challenge_logs_update on challenge_logs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy challenge_logs_delete on challenge_logs
  for delete to authenticated using (auth.uid() = user_id);
