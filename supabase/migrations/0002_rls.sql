-- Forge — 0002_rls.sql
-- Enable (and force) Row Level Security with owner-only policies on every table.
-- Idempotent: drops and recreates the four policies per table. Run after 0001.

do $$
declare
  t text;
  tables text[] := array[
    'profiles', 'challenges', 'challenge_phases',
    'dsa_problems', 'system_design_topics', 'daily_logs',
    'side_projects', 'project_milestones', 'profile_snapshots'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I enable row level security;', t);
    execute format('alter table %I force row level security;', t);

    execute format('drop policy if exists %I on %I;', t || '_select', t);
    execute format('drop policy if exists %I on %I;', t || '_insert', t);
    execute format('drop policy if exists %I on %I;', t || '_update', t);
    execute format('drop policy if exists %I on %I;', t || '_delete', t);

    execute format(
      'create policy %I on %I for select to authenticated using (auth.uid() = user_id);',
      t || '_select', t);
    execute format(
      'create policy %I on %I for insert to authenticated with check (auth.uid() = user_id);',
      t || '_insert', t);
    execute format(
      'create policy %I on %I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t || '_update', t);
    execute format(
      'create policy %I on %I for delete to authenticated using (auth.uid() = user_id);',
      t || '_delete', t);
  end loop;
end $$;
