-- Create user_roles table in public schema
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('tenant','landlord','builder','specialist','employee','admin')),
  created_at timestamptz default now()
);

alter table public.user_roles enable row level security;

-- Users can view their own roles
create policy if not exists "user_roles_select_own"
  on public.user_roles
  for select
  using (auth.uid() = user_id);

-- Users can insert their own roles
create policy if not exists "user_roles_insert_own"
  on public.user_roles
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own roles
create policy if not exists "user_roles_update_own"
  on public.user_roles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own roles
create policy if not exists "user_roles_delete_own"
  on public.user_roles
  for delete
  using (auth.uid() = user_id);
