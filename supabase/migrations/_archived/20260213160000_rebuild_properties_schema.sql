-- =============================================
-- REBUILD PROPERTIES TABLE - Fix Schema Cache (PGRST204)
-- Date: 2026-02-13
-- Purpose: Force PostgREST to recognize all columns
-- =============================================

-- Step 1: Backup existing properties data
create table if not exists public.properties_backup_20260213 as
select * from public.properties;

-- Step 2: Drop existing table and dependencies
drop trigger if exists update_properties_updated_at on public.properties;
drop trigger if exists trigger_set_property_code on public.properties;
drop policy if exists "properties_delete_own" on public.properties;
drop policy if exists "properties_update_own" on public.properties;
drop policy if exists "properties_insert_own" on public.properties;
drop policy if exists "properties_select_own" on public.properties;
drop table if exists public.properties cascade;

-- Step 3: Recreate properties table with complete schema
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  property_type text not null check (property_type in ('apartment', 'house', 'condo', 'commercial', 'other')),
  total_units integer not null default 1 check (total_units >= 1),
  description text,
  photos text[],
  property_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Foreign key constraint
  constraint properties_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);

-- Step 4: Enable RLS
alter table public.properties enable row level security;

-- Step 5: Create RLS policies
create policy "properties_select_own"
  on public.properties for select
  using (auth.uid() = user_id);

create policy "properties_insert_own"
  on public.properties for insert
  with check (auth.uid() = user_id);

create policy "properties_update_own"
  on public.properties for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "properties_delete_own"
  on public.properties for delete
  using (auth.uid() = user_id);

-- Step 6: Create indexes
create index properties_user_id_idx on public.properties(user_id);
create index properties_created_at_idx on public.properties(created_at desc);
create index properties_property_code_idx on public.properties(property_code) where property_code is not null;

-- Step 7: Restore data from backup
insert into public.properties (
  id, user_id, name, address, city, state, zip,
  property_type, total_units, description, photos,
  property_code, created_at, updated_at
)
select
  id,
  user_id,
  name,
  address,
  city,
  state,
  zip,
  property_type,
  total_units,
  description,
  photos,
  property_code,
  created_at,
  updated_at
from public.properties_backup_20260213
on conflict (id) do nothing;

-- Step 8: Create property code generation function
create or replace function public.generate_property_code(property_name text)
returns text
language plpgsql
security definer
as $$
declare
  prefix text;
  code text;
  code_exists boolean;
  attempt integer;
begin
  -- Extract first 3 letters from property name (uppercase, alphanumeric only)
  prefix := upper(regexp_replace(substring(property_name from 1 for 3), '[^A-Za-z0-9]', '', 'g'));

  -- Pad with 'X' if too short
  while length(prefix) < 3 loop
    prefix := prefix || 'X';
  end loop;

  -- Try to generate unique code (max 10 attempts)
  for attempt in 1..10 loop
    code := prefix || '-' || lpad(floor(random() * 10000)::text, 4, '0');

    select exists(
      select 1 from public.properties where property_code = code
    ) into code_exists;

    if not code_exists then
      return code;
    end if;
  end loop;

  -- Fallback: use timestamp suffix to ensure uniqueness
  return prefix || '-' || lpad((extract(epoch from now())::bigint % 10000)::text, 4, '0');
end;
$$;

-- Step 9: Create trigger function to auto-generate property codes
create or replace function public.set_property_code()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.property_code is null and new.name is not null then
    new.property_code := public.generate_property_code(new.name);
  end if;
  return new;
end;
$$;

-- Step 10: Create trigger
create trigger trigger_set_property_code
  before insert on public.properties
  for each row
  execute function public.set_property_code();

-- Step 11: Create updated_at trigger function (if not exists)
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Step 12: Create updated_at trigger
create trigger update_properties_updated_at
  before update on public.properties
  for each row
  execute function public.update_updated_at_column();

-- Step 13: Grant permissions
grant select, insert, update, delete on public.properties to authenticated;
grant usage on schema public to authenticated;

-- Step 14: Force PostgREST to reload schema cache
notify pgrst, 'reload schema';

-- =============================================
-- SUMMARY
-- =============================================
-- ✅ Backed up existing data to properties_backup_20260213
-- ✅ Dropped and recreated properties table with complete schema
-- ✅ Added all required columns: user_id, description, photos, property_code
-- ✅ Restored existing data
-- ✅ Created RLS policies (users can only access their own properties)
-- ✅ Created indexes for user_id, created_at, property_code
-- ✅ Created property code auto-generation trigger
-- ✅ Created updated_at trigger
-- ✅ Forced PostgREST schema reload
-- =============================================
