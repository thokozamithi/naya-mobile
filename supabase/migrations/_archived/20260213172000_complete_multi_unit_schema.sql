-- =============================================
-- COMPLETE MULTI-UNIT SCHEMA FIX
-- All-in-one migration for Properties, Units, and Tenants
-- Fixes: PGRST204 (properties), PGRST205 (units), tenants missing
-- =============================================

-- =============================================
-- PART 1: FIX PROPERTIES TABLE
-- =============================================

-- Rename owner_id to user_id if needed
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'properties'
    and column_name = 'owner_id'
  ) then
    alter table public.properties rename column owner_id to user_id;
    raise notice '✅ Renamed owner_id → user_id in properties';
  end if;
end $$;

-- Add missing columns to properties
alter table public.properties
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.properties
  alter column user_id set not null;

alter table public.properties
  add column if not exists updated_at timestamptz default now();

alter table public.properties
  add column if not exists photos text[];

alter table public.properties
  add column if not exists property_code text unique;

-- Ensure required columns are NOT NULL
alter table public.properties
  alter column address set not null;

alter table public.properties
  alter column city set not null;

alter table public.properties
  alter column state set not null;

alter table public.properties
  alter column zip set not null;

alter table public.properties
  alter column property_type set not null;

alter table public.properties
  alter column total_units set not null;

-- Add constraints
alter table public.properties
  drop constraint if exists properties_total_units_check;

alter table public.properties
  add constraint properties_total_units_check check (total_units >= 1);

alter table public.properties
  drop constraint if exists properties_property_type_check;

alter table public.properties
  add constraint properties_property_type_check
  check (property_type in ('apartment', 'house', 'condo', 'commercial', 'other'));

-- Create indexes
create index if not exists properties_user_id_idx on public.properties(user_id);
create index if not exists properties_created_at_idx on public.properties(created_at desc);
create index if not exists properties_property_code_idx on public.properties(property_code) where property_code is not null;

-- =============================================
-- PART 2: FIX UNITS TABLE
-- =============================================

-- Drop and recreate units table
drop table if exists public.units cascade;

create table public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null,
  unit_name text not null,
  unit_code text not null,
  status text not null default 'vacant' check (status in ('vacant', 'occupied', 'maintenance', 'unavailable')),
  bedrooms integer default 1,
  bathrooms numeric(2,1) default 1.0,
  square_feet integer,
  monthly_rent numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint units_property_id_fkey foreign key (property_id) references public.properties(id) on delete cascade
);

-- Unique constraint: unit_code must be unique within property
create unique index units_property_unit_code_unique
  on public.units(property_id, unit_code);

-- Indexes
create index units_property_id_idx on public.units(property_id);
create index units_status_idx on public.units(status);

-- =============================================
-- PART 3: CREATE TENANTS TABLE
-- =============================================

-- Drop and recreate tenants table
drop table if exists public.tenants cascade;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  move_in_date date,
  move_out_date date,
  lease_start_date date,
  lease_end_date date,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for tenants
create index tenants_user_id_idx on public.tenants(user_id);
create index tenants_property_id_idx on public.tenants(property_id);
create index tenants_unit_id_idx on public.tenants(unit_id);
create index tenants_status_idx on public.tenants(status);

-- Unique constraint: one active tenant per unit
create unique index tenants_unit_id_active_unique
  on public.tenants(unit_id)
  where status = 'active' and unit_id is not null;

-- =============================================
-- PART 4: RLS POLICIES - PROPERTIES
-- =============================================

alter table public.properties enable row level security;

drop policy if exists "properties_select_own" on public.properties;
drop policy if exists "properties_insert_own" on public.properties;
drop policy if exists "properties_update_own" on public.properties;
drop policy if exists "properties_delete_own" on public.properties;

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

-- =============================================
-- PART 5: RLS POLICIES - UNITS
-- =============================================

alter table public.units enable row level security;

drop policy if exists "units_select_via_property" on public.units;
drop policy if exists "units_insert_via_property" on public.units;
drop policy if exists "units_update_via_property" on public.units;
drop policy if exists "units_delete_via_property" on public.units;
drop policy if exists "units_select_tenant" on public.units;

create policy "units_select_via_property"
  on public.units for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = units.property_id
      and properties.user_id = auth.uid()
    )
  );

create policy "units_insert_via_property"
  on public.units for insert
  with check (
    exists (
      select 1 from public.properties
      where properties.id = units.property_id
      and properties.user_id = auth.uid()
    )
  );

create policy "units_update_via_property"
  on public.units for update
  using (
    exists (
      select 1 from public.properties
      where properties.id = units.property_id
      and properties.user_id = auth.uid()
    )
  );

create policy "units_delete_via_property"
  on public.units for delete
  using (
    exists (
      select 1 from public.properties
      where properties.id = units.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Tenants can view their assigned unit
create policy "units_select_tenant"
  on public.units for select
  using (
    exists (
      select 1 from public.tenants
      where tenants.unit_id = units.id
      and tenants.user_id = auth.uid()
      and tenants.status = 'active'
    )
  );

-- =============================================
-- PART 6: RLS POLICIES - TENANTS
-- =============================================

alter table public.tenants enable row level security;

-- Tenants can view their own record
create policy "tenants_select_own"
  on public.tenants for select
  using (auth.uid() = user_id);

-- Tenants can update their own record
create policy "tenants_update_own"
  on public.tenants for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Landlords can view tenants in their properties
create policy "tenants_select_via_property"
  on public.tenants for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Landlords can insert tenants into their properties
create policy "tenants_insert_via_property"
  on public.tenants for insert
  with check (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Landlords can update tenants in their properties
create policy "tenants_update_via_property"
  on public.tenants for update
  using (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Landlords can delete tenants from their properties
create policy "tenants_delete_via_property"
  on public.tenants for delete
  using (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.user_id = auth.uid()
    )
  );

-- =============================================
-- PART 7: TRIGGERS & FUNCTIONS
-- =============================================

-- Property code generation function
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
  prefix := upper(regexp_replace(substring(property_name from 1 for 3), '[^A-Za-z0-9]', '', 'g'));

  while length(prefix) < 3 loop
    prefix := prefix || 'X';
  end loop;

  for attempt in 1..10 loop
    code := prefix || '-' || lpad(floor(random() * 10000)::text, 4, '0');
    select exists(select 1 from public.properties where property_code = code) into code_exists;
    if not code_exists then
      return code;
    end if;
  end loop;

  return prefix || '-' || lpad((extract(epoch from now())::bigint % 10000)::text, 4, '0');
end;
$$;

-- Set property code trigger function
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

-- Updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply triggers
drop trigger if exists trigger_set_property_code on public.properties;
create trigger trigger_set_property_code
  before insert on public.properties
  for each row
  execute function public.set_property_code();

drop trigger if exists update_properties_updated_at on public.properties;
create trigger update_properties_updated_at
  before update on public.properties
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists update_units_updated_at on public.units;
create trigger update_units_updated_at
  before update on public.units
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists update_tenants_updated_at on public.tenants;
create trigger update_tenants_updated_at
  before update on public.tenants
  for each row
  execute function public.update_updated_at_column();

-- =============================================
-- PART 8: PERMISSIONS
-- =============================================

grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.units to authenticated;
grant select, insert, update, delete on public.tenants to authenticated;
grant usage on schema public to authenticated;

-- =============================================
-- PART 9: RELOAD SCHEMA CACHE
-- =============================================

notify pgrst, 'reload schema';

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

do $$
begin
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ COMPLETE MULTI-UNIT SCHEMA APPLIED';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ Properties: user_id fixed + missing columns added';
  raise notice '✅ Units: recreated with complete schema';
  raise notice '✅ Tenants: created with complete schema';
  raise notice '✅ RLS policies: applied to all three tables';
  raise notice '✅ Indexes: created for performance';
  raise notice '✅ Triggers: property_code + updated_at';
  raise notice '✅ Constraints: data integrity enforced';
  raise notice '✅ Schema cache: reloaded';
  raise notice '';
  raise notice '⏳ WAIT 10 SECONDS before testing';
  raise notice '';
  raise notice 'Your multi-unit property system is now ready!';
  raise notice '  1. Create properties ✅';
  raise notice '  2. Add units to properties ✅';
  raise notice '  3. Assign tenants to units ✅';
  raise notice '  4. Complete workflow ready 🎉';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
end $$;
