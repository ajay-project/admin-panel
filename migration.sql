-- ==========================================
-- MULTI-DEVICE SESSION MANAGEMENT MIGRATION
-- Run this in the Supabase SQL Editor
-- ==========================================

-- Step 1: Update public.users table columns
alter table public.users
add column if not exists max_sessions integer default 1;

alter table public.users
add column if not exists active_sessions_count integer default 0;

-- Step 2: Create active_sessions table
create table if not exists public.active_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  session_token text not null unique,
  device_name text,
  browser text,
  platform text,
  is_active boolean default true,
  created_at timestamptz default now(),
  last_activity timestamptz default now()
);

-- Step 3: Enable Row Level Security (RLS)
alter table public.active_sessions enable row level security;

-- Step 4: Drop existing policies if any to prevent duplicates
drop policy if exists "Users can view/manage their own sessions" on public.active_sessions;

-- Step 5: Create RLS Policy for active_sessions
create policy "Users can view/manage their own sessions"
  on public.active_sessions
  for all
  using (
    auth.uid() = user_id 
    OR 
    (select role from public.users where id = auth.uid()) = 'admin'
  );

-- Step 6: Automatic active_sessions_count maintenance trigger (Safety Net & Sync)
create or replace function public.maintain_active_sessions_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.users
    set active_sessions_count = (
      select count(*) from public.active_sessions 
      where user_id = new.user_id and is_active = true
    )
    where id = new.user_id;
  elsif tg_op = 'UPDATE' then
    update public.users
    set active_sessions_count = (
      select count(*) from public.active_sessions 
      where user_id = new.user_id and is_active = true
    )
    where id = new.user_id;
    
    if new.user_id <> old.user_id then
      update public.users
      set active_sessions_count = (
        select count(*) from public.active_sessions 
        where user_id = old.user_id and is_active = true
      )
      where id = old.user_id;
    end if;
  elsif tg_op = 'DELETE' then
    update public.users
    set active_sessions_count = (
      select count(*) from public.active_sessions 
      where user_id = old.user_id and is_active = true
    )
    where id = old.user_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then recreate
drop trigger if exists trg_maintain_active_sessions_count on public.active_sessions;
create trigger trg_maintain_active_sessions_count
after insert or update or delete on public.active_sessions
for each row execute function public.maintain_active_sessions_count();

-- Update default limits for existing users
-- Admins get 3 sessions, normal users get 1
update public.users
set max_sessions = 3
where role = 'admin';

update public.users
set max_sessions = 1
where role != 'admin' or role is null;
