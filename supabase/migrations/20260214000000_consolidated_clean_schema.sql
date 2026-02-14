-- =============================================
-- NAYA PLATFORM - CLEAN CONSOLIDATED SCHEMA
-- Single migration fixing all RLS recursion issues
-- Date: 2026-02-13
-- =============================================

-- =============================================
-- STEP 1: DROP ALL EXISTING TABLES (clean slate)
-- =============================================
drop table if exists public.messages cascade;
drop table if exists public.payments cascade;
drop table if exists public.leases cascade;
drop table if exists public.tenants cascade;
drop table if exists public.units cascade;
drop table if exists public.properties cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.properties_backup_20260213 cascade;

-- Drop old functions that might conflict
drop function if exists public.generate_property_code(text) cascade;
drop function if exists public.set_property_code() cascade;
drop function if exists public.generate_unit_join_code() cascade;
drop function if exists public.set_unit_join_code() cascade;
drop function if exists public.update_updated_at_column() cascade;
drop function if exists public.update_payments_updated_at() cascade;
drop function if exists public.join_unit_by_code(text) cascade;
drop function if exists public.leave_unit() cascade;
drop function if exists public.is_property_owner(uuid) cascade;
drop function if exists public.is_tenant_of_property(uuid) cascade;

-- =============================================
-- STEP 2: CREATE HELPER FUNCTIONS (SECURITY DEFINER)
-- These bypass RLS to prevent infinite recursion
-- =============================================

-- Helper: Check if current user owns a property (bypasses RLS)
create or replace function public.is_property_owner(p_property_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.properties
    where id = p_property_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: Check if current user is a tenant of a property (bypasses RLS)
create or replace function public.is_tenant_of_property(p_property_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.tenants
    where property_id = p_property_id 
      and user_id = auth.uid()
      and status = 'active'
  );
$$ language sql security definer stable;

-- Helper: Check if current user is assigned to a unit (bypasses RLS)
create or replace function public.is_tenant_of_unit(p_unit_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.tenants
    where unit_id = p_unit_id 
      and user_id = auth.uid()
      and status = 'active'
  );
$$ language sql security definer stable;

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

-- =============================================
-- STEP 3: USER ROLES TABLE
-- =============================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('tenant','landlord','builder','specialist','employee','admin')),
  created_at timestamptz default now(),
  unique(user_id, role)
);

alter table public.user_roles enable row level security;

create policy "user_roles_select_own" on public.user_roles
  for select using (auth.uid() = user_id);

create policy "user_roles_insert_own" on public.user_roles
  for insert with check (auth.uid() = user_id);

create policy "user_roles_update_own" on public.user_roles
  for update using (auth.uid() = user_id);

create policy "user_roles_delete_own" on public.user_roles
  for delete using (auth.uid() = user_id);

-- =============================================
-- STEP 4: PROPERTIES TABLE
-- =============================================
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
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
  updated_at timestamptz not null default now()
);

create index properties_user_id_idx on public.properties(user_id);
create index properties_created_at_idx on public.properties(created_at desc);
create index properties_property_code_idx on public.properties(property_code) where property_code is not null;

alter table public.properties enable row level security;

-- Landlord policies (direct ownership check, no recursion)
create policy "properties_select_owner" on public.properties
  for select using (auth.uid() = user_id);

create policy "properties_insert_owner" on public.properties
  for insert with check (auth.uid() = user_id);

create policy "properties_update_owner" on public.properties
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "properties_delete_owner" on public.properties
  for delete using (auth.uid() = user_id);

-- Tenant can view their property (uses SECURITY DEFINER helper)
create policy "properties_select_tenant" on public.properties
  for select using (public.is_tenant_of_property(id));

-- Property code generation
create or replace function public.generate_property_code(property_name text)
returns text
language plpgsql
security definer
as $$
declare
  prefix text;
  code text;
  attempt integer;
begin
  prefix := upper(regexp_replace(substring(property_name from 1 for 3), '[^A-Za-z0-9]', '', 'g'));
  while length(prefix) < 3 loop
    prefix := prefix || 'X';
  end loop;

  for attempt in 1..10 loop
    code := prefix || '-' || lpad(floor(random() * 10000)::text, 4, '0');
    if not exists(select 1 from public.properties where property_code = code) then
      return code;
    end if;
  end loop;

  return prefix || '-' || lpad((extract(epoch from now())::bigint % 10000)::text, 4, '0');
end;
$$;

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

create trigger trigger_set_property_code
  before insert on public.properties
  for each row execute function public.set_property_code();

create trigger update_properties_updated_at
  before update on public.properties
  for each row execute function public.update_updated_at_column();

-- =============================================
-- STEP 5: UNITS TABLE
-- =============================================
create table public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_name text not null,
  unit_code text not null,
  unit_join_code text not null unique,
  status text not null default 'vacant' check (status in ('vacant', 'occupied', 'maintenance', 'unavailable')),
  bedrooms integer default 1,
  bathrooms numeric(2,1) default 1.0,
  square_feet integer,
  monthly_rent numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index units_property_unit_code_unique on public.units(property_id, unit_code);
create index units_property_id_idx on public.units(property_id);
create index units_status_idx on public.units(status);
create index units_join_code_idx on public.units(unit_join_code);

alter table public.units enable row level security;

-- Landlord policies (uses SECURITY DEFINER helper)
create policy "units_select_owner" on public.units
  for select using (public.is_property_owner(property_id));

create policy "units_insert_owner" on public.units
  for insert with check (public.is_property_owner(property_id));

create policy "units_update_owner" on public.units
  for update using (public.is_property_owner(property_id));

create policy "units_delete_owner" on public.units
  for delete using (public.is_property_owner(property_id));

-- Tenant can view their unit (uses SECURITY DEFINER helper)
create policy "units_select_tenant" on public.units
  for select using (public.is_tenant_of_unit(id));

-- Unit join code generation
create or replace function generate_unit_join_code()
returns text as $$
declare
  new_code text;
begin
  loop
    new_code := upper(
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      lpad(floor(random() * 10000)::text, 4, '0')
    );
    if not exists(select 1 from public.units where unit_join_code = new_code) then
      return new_code;
    end if;
  end loop;
end;
$$ language plpgsql;

create or replace function set_unit_join_code()
returns trigger as $$
begin
  if new.unit_join_code is null or new.unit_join_code = '' then
    new.unit_join_code := generate_unit_join_code();
  else
    new.unit_join_code := upper(trim(new.unit_join_code));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger unit_join_code_trigger
  before insert or update on public.units
  for each row execute function set_unit_join_code();

create trigger update_units_updated_at
  before update on public.units
  for each row execute function public.update_updated_at_column();

-- =============================================
-- STEP 6: TENANTS TABLE
-- =============================================
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade not null,
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

create index tenants_user_id_idx on public.tenants(user_id);
create index tenants_property_id_idx on public.tenants(property_id);
create index tenants_unit_id_idx on public.tenants(unit_id);
create index tenants_status_idx on public.tenants(status);
create unique index tenants_unit_active_unique on public.tenants(unit_id) where status = 'active' and unit_id is not null;

alter table public.tenants enable row level security;

-- Tenant can view/update their own record (direct check, no recursion)
create policy "tenants_select_own" on public.tenants
  for select using (auth.uid() = user_id);

create policy "tenants_update_own" on public.tenants
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Landlord policies (uses SECURITY DEFINER helper to avoid recursion)
create policy "tenants_select_landlord" on public.tenants
  for select using (public.is_property_owner(property_id));

create policy "tenants_insert_landlord" on public.tenants
  for insert with check (public.is_property_owner(property_id));

create policy "tenants_update_landlord" on public.tenants
  for update using (public.is_property_owner(property_id));

create policy "tenants_delete_landlord" on public.tenants
  for delete using (public.is_property_owner(property_id));

create trigger update_tenants_updated_at
  before update on public.tenants
  for each row execute function public.update_updated_at_column();

-- =============================================
-- STEP 7: PAYMENTS TABLE
-- =============================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete set null,
  amount decimal(10, 2) not null check (amount > 0),
  payment_type text not null default 'rent' check (payment_type in ('rent', 'deposit', 'late_fee', 'maintenance', 'other')),
  payment_method text check (payment_method in ('credit_card', 'debit_card', 'bank_transfer', 'cash', 'check', 'other')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'refunded')),
  due_date date not null,
  paid_date timestamptz,
  payment_period text,
  transaction_id text,
  notes text,
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index payments_user_id_idx on public.payments(user_id);
create index payments_property_id_idx on public.payments(property_id);
create index payments_status_idx on public.payments(status);
create index payments_due_date_idx on public.payments(due_date);

alter table public.payments enable row level security;

-- Tenant can view/create their own payments
create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

create policy "payments_insert_own" on public.payments
  for insert with check (auth.uid() = user_id);

create policy "payments_update_own" on public.payments
  for update using (auth.uid() = user_id and status = 'pending');

-- Landlord can view/update payments for their properties
create policy "payments_select_landlord" on public.payments
  for select using (public.is_property_owner(property_id));

create policy "payments_update_landlord" on public.payments
  for update using (public.is_property_owner(property_id));

create trigger update_payments_updated_at
  before update on public.payments
  for each row execute function public.update_updated_at_column();

-- =============================================
-- STEP 8: MESSAGES TABLE
-- =============================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete set null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index messages_property_id_idx on public.messages(property_id);
create index messages_sender_id_idx on public.messages(sender_id);
create index messages_receiver_id_idx on public.messages(receiver_id);
create index messages_created_at_idx on public.messages(created_at desc);

alter table public.messages enable row level security;

-- Users can view messages they sent or received
create policy "messages_select_own" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can insert messages where they are the sender
create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = sender_id);

-- Users can mark messages as read
create policy "messages_update_receiver" on public.messages
  for update using (auth.uid() = receiver_id);

create trigger update_messages_updated_at
  before update on public.messages
  for each row execute function public.update_updated_at_column();

-- =============================================
-- STEP 9: LEASES TABLE
-- =============================================
create table public.leases (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  monthly_rent numeric(10,2) not null,
  security_deposit numeric(10,2),
  status text default 'active' check (status in ('active', 'expired', 'terminated', 'pending')),
  lease_document_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index leases_property_id_idx on public.leases(property_id);
create index leases_tenant_id_idx on public.leases(tenant_id);
create index leases_status_idx on public.leases(status);

alter table public.leases enable row level security;

-- Tenants can view their own leases
create policy "leases_select_tenant" on public.leases
  for select using (
    exists (select 1 from public.tenants where tenants.id = leases.tenant_id and tenants.user_id = auth.uid())
  );

-- Landlords can manage leases
create policy "leases_select_landlord" on public.leases
  for select using (public.is_property_owner(property_id));

create policy "leases_insert_landlord" on public.leases
  for insert with check (public.is_property_owner(property_id));

create policy "leases_update_landlord" on public.leases
  for update using (public.is_property_owner(property_id));

create policy "leases_delete_landlord" on public.leases
  for delete using (public.is_property_owner(property_id));

create trigger update_leases_updated_at
  before update on public.leases
  for each row execute function public.update_updated_at_column();

-- =============================================
-- STEP 10: RPC FUNCTIONS
-- =============================================

-- Join unit by code
create or replace function join_unit_by_code(p_code text)
returns json as $$
declare
  v_user_id uuid;
  v_unit record;
  v_existing record;
  v_user_email text;
  v_user_name text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  p_code := upper(trim(p_code));

  -- Find unit by join code
  select u.*, p.name as property_name, p.id as prop_id
  into v_unit
  from public.units u
  join public.properties p on p.id = u.property_id
  where u.unit_join_code = p_code;

  if v_unit is null then
    return json_build_object('success', false, 'error', 'Invalid join code');
  end if;

  -- Check if user already has an active tenant record for this property
  select * into v_existing
  from public.tenants
  where user_id = v_user_id
    and property_id = v_unit.prop_id
    and status = 'active';

  if v_existing is not null then
    return json_build_object('success', false, 'error', 'You are already linked to this property');
  end if;

  -- Get user info
  select email, raw_user_meta_data->>'full_name'
  into v_user_email, v_user_name
  from auth.users where id = v_user_id;

  -- Create tenant record
  insert into public.tenants (user_id, property_id, unit_id, full_name, email, status, move_in_date)
  values (v_user_id, v_unit.prop_id, v_unit.id, coalesce(v_user_name, 'Tenant'), v_user_email, 'active', current_date);

  -- Update unit status
  update public.units set status = 'occupied', updated_at = now() where id = v_unit.id;

  return json_build_object(
    'success', true,
    'property_name', v_unit.property_name,
    'unit_name', v_unit.unit_name,
    'message', 'Successfully joined ' || v_unit.unit_name || ' at ' || v_unit.property_name
  );
end;
$$ language plpgsql security definer;

-- Leave unit
create or replace function leave_unit()
returns json as $$
declare
  v_user_id uuid;
  v_tenant record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select * into v_tenant
  from public.tenants
  where user_id = v_user_id and status = 'active';

  if v_tenant is null then
    return json_build_object('success', false, 'error', 'No active membership found');
  end if;

  update public.tenants
  set status = 'inactive', move_out_date = current_date, updated_at = now()
  where id = v_tenant.id;

  if v_tenant.unit_id is not null then
    update public.units set status = 'vacant', updated_at = now() where id = v_tenant.unit_id;
  end if;

  return json_build_object('success', true, 'message', 'Successfully left the unit');
end;
$$ language plpgsql security definer;

-- =============================================
-- STEP 11: GRANTS
-- =============================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.units to authenticated;
grant select, insert, update, delete on public.tenants to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.leases to authenticated;
grant execute on function public.is_property_owner(uuid) to authenticated;
grant execute on function public.is_tenant_of_property(uuid) to authenticated;
grant execute on function public.is_tenant_of_unit(uuid) to authenticated;
grant execute on function public.join_unit_by_code(text) to authenticated;
grant execute on function public.leave_unit() to authenticated;

-- =============================================
-- STEP 12: RELOAD SCHEMA CACHE
-- =============================================
notify pgrst, 'reload schema';

-- =============================================
-- DONE
-- =============================================
do $$ begin
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ CLEAN CONSOLIDATED SCHEMA APPLIED';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ All tables recreated with proper schema';
  raise notice '✅ RLS policies use SECURITY DEFINER helpers';
  raise notice '✅ NO MORE INFINITE RECURSION';
  raise notice '✅ Property codes auto-generated';
  raise notice '✅ Unit join codes auto-generated';
  raise notice '✅ join_unit_by_code() and leave_unit() functions ready';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
end $$;
