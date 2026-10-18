-- Orbit's database schema and user-isolation policies.
-- Apply this migration with the Supabase CLI or SQL Editor before using the app.

create extension if not exists "pgcrypto";

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text not null default '',
  target_date date,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'Active' check (status in ('Active', 'Completed', 'Paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text not null default '',
  status text not null default 'Planning' check (status in ('Planning', 'In Progress', 'Completed')),
  progress integer not null default 0 check (progress between 0 and 100),
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_due_date_after_start_date check (
    due_date is null or start_date is null or due_date >= start_date
  )
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '',
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing Orbit databases may predate audit timestamps. Add them before
-- installing the update triggers below.
alter table public.goals add column if not exists updated_at timestamptz not null default now();
alter table public.projects add column if not exists updated_at timestamptz not null default now();
alter table public.tasks add column if not exists updated_at timestamptz not null default now();

create index if not exists goals_user_id_created_at_idx on public.goals (user_id, created_at desc);
create index if not exists projects_user_id_created_at_idx on public.projects (user_id, created_at desc);
create index if not exists tasks_user_id_created_at_idx on public.tasks (user_id, created_at desc);
create index if not exists tasks_goal_id_idx on public.tasks (goal_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.enforce_task_goal_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.goal_id is not null and not exists (
    select 1 from public.goals
    where id = new.goal_id and user_id = new.user_id
  ) then
    raise exception 'A task can only be assigned to one of its owner''s goals';
  end if;
  return new;
end;
$$;

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at before update on public.goals
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists tasks_enforce_goal_owner on public.tasks;
create trigger tasks_enforce_goal_owner before insert or update on public.tasks
for each row execute function public.enforce_task_goal_owner();

alter table public.goals enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

alter table public.goals force row level security;
alter table public.projects force row level security;
alter table public.tasks force row level security;

drop policy if exists "Users manage their own goals" on public.goals;
create policy "Users manage their own goals" on public.goals
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage their own projects" on public.projects;
create policy "Users manage their own projects" on public.projects
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks" on public.tasks
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
