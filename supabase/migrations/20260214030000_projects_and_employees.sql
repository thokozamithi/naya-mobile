-- =============================================
-- Migration: Projects, Employees, Project Assignments, Project Updates
-- Date: 2026-02-14
-- Purpose: Enable landlord→employee task management workflow
-- =============================================

-- =============================================
-- 1. EMPLOYEES TABLE
-- Links auth users to a landlord's team
-- =============================================
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  landlord_id uuid references auth.users(id) on delete cascade not null,
  full_name text not null default '',
  email text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive', 'invited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, landlord_id)
);

create index if not exists employees_user_id_idx on public.employees(user_id);
create index if not exists employees_landlord_id_idx on public.employees(landlord_id);
create index if not exists employees_status_idx on public.employees(status);

-- RLS
alter table public.employees enable row level security;

-- Employee can see their own record
create policy "employees_select_own" on public.employees
  for select using (auth.uid() = user_id);

-- Landlord can see employees they manage
create policy "employees_select_landlord" on public.employees
  for select using (auth.uid() = landlord_id);

-- Landlord can add employees
create policy "employees_insert_landlord" on public.employees
  for insert with check (auth.uid() = landlord_id);

-- Landlord can update their employees
create policy "employees_update_landlord" on public.employees
  for update using (auth.uid() = landlord_id);

-- Landlord can remove employees
create policy "employees_delete_landlord" on public.employees
  for delete using (auth.uid() = landlord_id);

-- =============================================
-- 2. PROJECTS TABLE
-- Owned by landlord, optionally linked to a property
-- =============================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid references auth.users(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  budget numeric(12,2),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  due_date date,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_landlord_id_idx on public.projects(landlord_id);
create index if not exists projects_property_id_idx on public.projects(property_id);
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_created_at_idx on public.projects(created_at desc);

-- RLS
alter table public.projects enable row level security;

-- Landlord can do everything with their projects
create policy "projects_select_landlord" on public.projects
  for select using (auth.uid() = landlord_id);
create policy "projects_insert_landlord" on public.projects
  for insert with check (auth.uid() = landlord_id);
create policy "projects_update_landlord" on public.projects
  for update using (auth.uid() = landlord_id);
create policy "projects_delete_landlord" on public.projects
  for delete using (auth.uid() = landlord_id);

-- NOTE: projects_select_employee and projects_update_employee added AFTER
-- project_assignments table is created (see below)

-- =============================================
-- 3. PROJECT ASSIGNMENTS
-- Links projects to employees (or specialists)
-- =============================================
create table if not exists public.project_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  employee_id uuid references public.employees(id) on delete cascade,
  specialist_id uuid, -- fk added later if specialists table exists
  role text not null default 'assignee' check (role in ('assignee', 'reviewer', 'lead')),
  assigned_at timestamptz not null default now(),
  unique(project_id, employee_id)
);

create index if not exists project_assignments_project_id_idx on public.project_assignments(project_id);
create index if not exists project_assignments_employee_id_idx on public.project_assignments(employee_id);

-- RLS
alter table public.project_assignments enable row level security;

-- Landlord can manage assignments for their projects
create policy "project_assignments_select_landlord" on public.project_assignments
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_assignments.project_id
        and p.landlord_id = auth.uid()
    )
  );
create policy "project_assignments_insert_landlord" on public.project_assignments
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_assignments.project_id
        and p.landlord_id = auth.uid()
    )
  );
create policy "project_assignments_delete_landlord" on public.project_assignments
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_assignments.project_id
        and p.landlord_id = auth.uid()
    )
  );

-- Employee can see their own assignments
create policy "project_assignments_select_employee" on public.project_assignments
  for select using (
    exists (
      select 1 from public.employees e
      where e.id = project_assignments.employee_id
        and e.user_id = auth.uid()
    )
  );

-- NOW add employee policies on projects (project_assignments exists)
create policy "projects_select_employee" on public.projects
  for select using (
    exists (
      select 1 from public.project_assignments pa
      join public.employees e on e.id = pa.employee_id
      where pa.project_id = projects.id
        and e.user_id = auth.uid()
    )
  );

-- =============================================
-- 4. PROJECT UPDATES (activity log / notes)
-- =============================================
create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete cascade not null,
  note text,
  status_change text, -- e.g. 'pending→in_progress'
  progress_change integer, -- e.g. 50
  created_at timestamptz not null default now()
);

create index if not exists project_updates_project_id_idx on public.project_updates(project_id);
create index if not exists project_updates_created_at_idx on public.project_updates(created_at desc);

-- RLS
alter table public.project_updates enable row level security;

-- Landlord can see updates on their projects
create policy "project_updates_select_landlord" on public.project_updates
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_updates.project_id
        and p.landlord_id = auth.uid()
    )
  );

-- Landlord can create updates
create policy "project_updates_insert_landlord" on public.project_updates
  for insert with check (auth.uid() = author_id);

-- Employee can see updates on projects assigned to them
create policy "project_updates_select_employee" on public.project_updates
  for select using (
    exists (
      select 1 from public.project_assignments pa
      join public.employees e on e.id = pa.employee_id
      join public.projects p on p.id = pa.project_id
      where pa.project_id = project_updates.project_id
        and e.user_id = auth.uid()
    )
  );

-- Employee can insert updates on projects assigned to them
create policy "project_updates_insert_employee" on public.project_updates
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.project_assignments pa
      join public.employees e on e.id = pa.employee_id
      where pa.project_id = project_updates.project_id
        and e.user_id = auth.uid()
    )
  );

-- Employee can update assigned project status/progress
create policy "projects_update_employee" on public.projects
  for update using (
    exists (
      select 1 from public.project_assignments pa
      join public.employees e on e.id = pa.employee_id
      where pa.project_id = projects.id
        and e.user_id = auth.uid()
    )
  );

-- =============================================
-- 5. SPECIALISTS TABLE (if not exists)
-- =============================================
create table if not exists public.specialists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  trade text not null default 'general',
  specialties text[] default '{}',
  bio text,
  hourly_rate numeric(8,2),
  rating numeric(3,2),
  review_count integer default 0,
  location text,
  profile_photo text,
  verified boolean default false,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists specialists_trade_idx on public.specialists(trade);
create index if not exists specialists_status_idx on public.specialists(status);
create index if not exists specialists_user_id_idx on public.specialists(user_id);

-- RLS
alter table public.specialists enable row level security;

-- Anyone authenticated can view active specialists
create policy "specialists_select_authenticated" on public.specialists
  for select using (status = 'active' or (user_id is not null and auth.uid() = user_id));

-- Specialist can update their own profile
create policy "specialists_update_own" on public.specialists
  for update using (user_id is not null and auth.uid() = user_id);

-- Specialist can insert their own profile
create policy "specialists_insert_own" on public.specialists
  for insert with check (user_id is not null and auth.uid() = user_id);

-- =============================================
-- 6. MESSAGE_THREADS TABLE (for structured conversations)
-- =============================================
create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  subject text,
  property_id uuid references public.properties(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create index if not exists message_threads_last_message_at_idx on public.message_threads(last_message_at desc);
create index if not exists message_threads_property_id_idx on public.message_threads(property_id);
create index if not exists message_threads_project_id_idx on public.message_threads(project_id);

-- RLS
alter table public.message_threads enable row level security;

-- Only participants can see threads
create policy "message_threads_select_participant" on public.message_threads
  for select using (
    exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = message_threads.id
        and tp.user_id = auth.uid()
    )
  );

-- Authenticated users can create threads
create policy "message_threads_insert" on public.message_threads
  for insert with check (true);

-- Participants can update thread (e.g. last_message_at)
create policy "message_threads_update" on public.message_threads
  for update using (
    exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = message_threads.id
        and tp.user_id = auth.uid()
    )
  );

-- =============================================
-- 7. THREAD PARTICIPANTS
-- =============================================
create table if not exists public.thread_participants (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.message_threads(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('member', 'owner')),
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(thread_id, user_id)
);

create index if not exists thread_participants_thread_id_idx on public.thread_participants(thread_id);
create index if not exists thread_participants_user_id_idx on public.thread_participants(user_id);

-- RLS
alter table public.thread_participants enable row level security;

-- User can see threads they are in
create policy "thread_participants_select_own" on public.thread_participants
  for select using (auth.uid() = user_id);

-- Users can see other participants in their threads
create policy "thread_participants_select_coparticipant" on public.thread_participants
  for select using (
    exists (
      select 1 from public.thread_participants tp2
      where tp2.thread_id = thread_participants.thread_id
        and tp2.user_id = auth.uid()
    )
  );

-- Authenticated users can add participants (when creating thread)
create policy "thread_participants_insert" on public.thread_participants
  for insert with check (true);

-- Users can update their own read status
create policy "thread_participants_update_own" on public.thread_participants
  for update using (auth.uid() = user_id);

-- =============================================
-- 8. THREAD MESSAGES
-- =============================================
create table if not exists public.thread_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.message_threads(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists thread_messages_thread_id_idx on public.thread_messages(thread_id);
create index if not exists thread_messages_created_at_idx on public.thread_messages(created_at);

-- RLS
alter table public.thread_messages enable row level security;

-- Only thread participants can read messages
create policy "thread_messages_select_participant" on public.thread_messages
  for select using (
    exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = thread_messages.thread_id
        and tp.user_id = auth.uid()
    )
  );

-- Only thread participants can send messages
create policy "thread_messages_insert_participant" on public.thread_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = thread_messages.thread_id
        and tp.user_id = auth.uid()
    )
  );

-- =============================================
-- TRIGGERS: updated_at
-- =============================================
create trigger update_employees_updated_at
  before update on public.employees
  for each row execute function public.update_updated_at_column();

create trigger update_projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at_column();

create trigger update_specialists_updated_at
  before update on public.specialists
  for each row execute function public.update_updated_at_column();

-- =============================================
-- GRANTS
-- =============================================
grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_assignments to authenticated;
grant select, insert on public.project_updates to authenticated;
grant select, insert, update, delete on public.specialists to authenticated;
grant select, insert, update on public.message_threads to authenticated;
grant select, insert, update on public.thread_participants to authenticated;
grant select, insert on public.thread_messages to authenticated;

-- Reload schema cache
notify pgrst, 'reload schema';

do $$ begin
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ PROJECTS + EMPLOYEES + MESSAGING SYSTEM CREATED';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ employees (landlord→employee team management)';
  raise notice '✅ projects (landlord-owned, property-linked)';
  raise notice '✅ project_assignments (employee←→project linking)';
  raise notice '✅ project_updates (activity log with notes)';
  raise notice '✅ specialists (searchable directory)';
  raise notice '✅ message_threads + thread_participants + thread_messages';
  raise notice '✅ RLS: role-based access on all tables';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
end $$;
