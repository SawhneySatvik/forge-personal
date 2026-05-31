-- Forge — 0004_profile_trigger.sql
-- Auto-create a profiles row whenever a user is added to auth.users, so the
-- single user always has exactly one profile (with the default timezone).
-- security definer lets the trigger insert on behalf of the new user.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
