-- =============================================
-- Migration: Fix projects RLS recursion + add project notes/messages
-- Date: 2026-02-14
-- =============================================

begin;

-- Ensure projects has unit_id
alter table public.projects
  add column if not exists unit_id uuid references public.units(id) on delete set null;
create index if not exists projects_unit_id_idx on public.projects(unit_id);

-- Ensure project_assignments has assigned_by
alter table public.project_assignments
  add column if not exists assigned_by uuid references auth.users(id) on delete set null;

-- =============================================
-- Project Notes (timeline)
-- =============================================
create table if not exists public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete cascade not null,
  author_role text not null default 'system' check (author_role in ('landlord', 'employee', 'tenant', 'system')),
  visibility text not null default 'internal' check (visibility in ('internal', 'tenant')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists project_notes_project_id_idx on public.project_notes(project_id);
create index if not exists project_notes_created_at_idx on public.project_notes(created_at desc);
create index if not exists project_notes_visibility_idx on public.project_notes(visibility);

-- =============================================
-- Project Threads + Messages
-- =============================================
create table if not exists public.project_threads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(project_id)
);

create index if not exists project_threads_project_id_idx on public.project_threads(project_id);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.project_threads(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists project_messages_thread_id_idx on public.project_messages(thread_id);
create index if not exists project_messages_created_at_idx on public.project_messages(created_at);

-- =============================================
-- SECURITY DEFINER helpers (avoid RLS recursion)
-- =============================================
create or replace function public.is_project_landlord(p_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and landlord_id = auth.uid()
  );
$$;

create or replace function public.is_project_assignee(p_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.project_assignments pa
    join public.employees e on e.id = pa.employee_id
    where pa.project_id = p_project_id
      and e.user_id = auth.uid()
  );
$$;

create or replace function public.is_tenant_of_project(p_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and (
        (p.unit_id is not null and public.is_tenant_of_unit(p.unit_id))
        or (p.property_id is not null and public.is_tenant_of_property(p.property_id))
      )
  );
$$;

-- =============================================
-- RLS: Fix recursion on projects + assignments
-- =============================================
alter table public.projects enable row level security;

drop policy if exists projects_select_landlord on public.projects;
drop policy if exists projects_insert_landlord on public.projects;
drop policy if exists projects_update_landlord on public.projects;
drop policy if exists projects_delete_landlord on public.projects;
drop policy if exists projects_select_employee on public.projects;
drop policy if exists projects_update_employee on public.projects;

create policy projects_select_landlord on public.projects
  for select using (auth.uid() = landlord_id);

create policy projects_insert_landlord on public.projects
  for insert with check (auth.uid() = landlord_id);

create policy projects_update_landlord on public.projects
  for update using (auth.uid() = landlord_id);

create policy projects_delete_landlord on public.projects
  for delete using (auth.uid() = landlord_id);

create policy projects_select_employee on public.projects
  for select using (public.is_project_assignee(id));

create policy projects_update_employee on public.projects
  for update using (public.is_project_assignee(id));

-- Employees can update status only (enforced by trigger)
create or replace function public.enforce_project_employee_update()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if public.is_project_landlord(old.id) then
    return new;
  end if;

  if public.is_project_assignee(old.id) then
    if new.title is not distinct from old.title
      and new.description is not distinct from old.description
      and new.priority is not distinct from old.priority
      and new.budget is not distinct from old.budget
      and new.progress is not distinct from old.progress
      and new.property_id is not distinct from old.property_id
      and new.unit_id is not distinct from old.unit_id
      and new.due_date is not distinct from old.due_date
      and new.created_at is not distinct from old.created_at
      and new.landlord_id is not distinct from old.landlord_id
    then
      return new;
    end if;

    raise exception 'Employees can only update project status';
  end if;

  raise exception 'Not authorized';
end;
$$;

drop trigger if exists enforce_project_employee_update on public.projects;
create trigger enforce_project_employee_update
  before update on public.projects
  for each row execute function public.enforce_project_employee_update();

alter table public.project_assignments enable row level security;

drop policy if exists project_assignments_select_landlord on public.project_assignments;
drop policy if exists project_assignments_insert_landlord on public.project_assignments;
drop policy if exists project_assignments_delete_landlord on public.project_assignments;
drop policy if exists project_assignments_select_employee on public.project_assignments;

create policy project_assignments_select_landlord on public.project_assignments
  for select using (public.is_project_landlord(project_id));

create policy project_assignments_insert_landlord on public.project_assignments
  for insert with check (public.is_project_landlord(project_id));

create policy project_assignments_delete_landlord on public.project_assignments
  for delete using (public.is_project_landlord(project_id));

create policy project_assignments_select_employee on public.project_assignments
  for select using (
    exists (
      select 1 from public.employees e
      where e.id = project_assignments.employee_id
        and e.user_id = auth.uid()
    )
  );

-- =============================================
-- RLS: Project Notes
-- =============================================
alter table public.project_notes enable row level security;

create policy project_notes_select_landlord on public.project_notes
  for select using (public.is_project_landlord(project_id));

create policy project_notes_select_employee on public.project_notes
  for select using (public.is_project_assignee(project_id));

create policy project_notes_select_tenant on public.project_notes
  for select using (
    visibility = 'tenant'
    and public.is_tenant_of_project(project_id)
  );

create policy project_notes_insert_landlord on public.project_notes
  for insert with check (
    auth.uid() = author_id
    and public.is_project_landlord(project_id)
  );

create policy project_notes_insert_employee on public.project_notes
  for insert with check (
    auth.uid() = author_id
    and public.is_project_assignee(project_id)
  );

-- =============================================
-- RLS: Project Threads + Messages
-- =============================================
alter table public.project_threads enable row level security;

create policy project_threads_select_landlord on public.project_threads
  for select using (public.is_project_landlord(project_id));

create policy project_threads_select_employee on public.project_threads
  for select using (public.is_project_assignee(project_id));

create policy project_threads_insert_landlord on public.project_threads
  for insert with check (public.is_project_landlord(project_id));

alter table public.project_messages enable row level security;

create policy project_messages_select_member on public.project_messages
  for select using (
    exists (
      select 1 from public.project_threads pt
      where pt.id = project_messages.thread_id
        and (public.is_project_landlord(pt.project_id) or public.is_project_assignee(pt.project_id))
    )
  );

create policy project_messages_insert_member on public.project_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.project_threads pt
      where pt.id = project_messages.thread_id
        and (public.is_project_landlord(pt.project_id) or public.is_project_assignee(pt.project_id))
    )
  );

-- =============================================
-- Trigger: auto-create project thread
-- =============================================
create or replace function public.create_project_thread()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  insert into public.project_threads(project_id)
  values (new.id)
  on conflict (project_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trigger_create_project_thread on public.projects;
create trigger trigger_create_project_thread
  after insert on public.projects
  for each row execute function public.create_project_thread();

insert into public.project_threads (project_id)
select p.id from public.projects p
on conflict (project_id) do nothing;

-- =============================================
-- Backfill project_notes from project_updates (best-effort)
-- =============================================
insert into public.project_notes (project_id, author_id, author_role, visibility, body, created_at)
select
  pu.project_id,
  pu.author_id,
  coalesce((select ur.role from public.user_roles ur where ur.user_id = pu.author_id limit 1), 'system') as author_role,
  'internal' as visibility,
  trim(
    coalesce(pu.note, '')
    || case when pu.status_change is not null then
      case when coalesce(pu.note, '') <> '' then ' | ' else '' end || 'Status: ' || replace(pu.status_change, '→', ' -> ')
    else '' end
    || case when pu.progress_change is not null then
      case when (coalesce(pu.note, '') <> '' or pu.status_change is not null) then ' | ' else '' end || 'Progress: ' || pu.progress_change::text || '%'
    else '' end
  ) as body,
  pu.created_at
from public.project_updates pu;

-- Grants
grant select, insert, delete on public.project_assignments to authenticated;
grant select, insert on public.project_notes to authenticated;
grant select, insert on public.project_threads to authenticated;
grant select, insert on public.project_messages to authenticated;

commit;
