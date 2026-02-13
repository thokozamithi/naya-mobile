-- =============================================
-- Naya Platform - Core Database Schema
-- P0 Batch 0: Foundation Tables
-- =============================================

-- 1. PROPERTIES TABLE
-- Stores property information for landlords/builders
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  property_type text not null check (property_type in ('apartment', 'house', 'condo', 'commercial', 'other')),
  total_units integer not null default 1,
  description text,
  photos text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.properties enable row level security;

-- RLS Policies for properties
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

-- Index for faster queries
create index if not exists properties_user_id_idx on public.properties(user_id);

-- =============================================

-- 2. UNITS TABLE
-- Individual rental units within properties
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_name text not null,
  unit_code text not null,
  status text not null default 'vacant' check (status in ('vacant', 'occupied', 'maintenance', 'unavailable')),
  bedrooms integer default 1,
  bathrooms numeric(2,1) default 1.0,
  square_feet integer,
  monthly_rent numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.units enable row level security;

-- RLS: Users can see units for their own properties
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

create index if not exists units_property_id_idx on public.units(property_id);

-- =============================================

-- 3. TENANTS TABLE
-- Tenant information and property assignment
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  move_in_date date,
  move_out_date date,
  status text default 'active' check (status in ('active', 'inactive', 'pending')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tenants enable row level security;

-- Tenants can view their own record
create policy "tenants_select_own"
  on public.tenants for select
  using (auth.uid() = user_id);

-- Landlords can view tenants in their properties
create policy "tenants_select_landlord"
  on public.tenants for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Landlords can insert tenants into their properties
create policy "tenants_insert_landlord"
  on public.tenants for insert
  with check (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Landlords can update tenants in their properties
create policy "tenants_update_landlord"
  on public.tenants for update
  using (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.user_id = auth.uid()
    )
  );

create index if not exists tenants_user_id_idx on public.tenants(user_id);
create index if not exists tenants_property_id_idx on public.tenants(property_id);

-- =============================================

-- 4. LEASES TABLE
-- Rental agreements between landlords and tenants
create table if not exists public.leases (
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

alter table public.leases enable row level security;

-- Tenants can view their own leases
create policy "leases_select_tenant"
  on public.leases for select
  using (
    exists (
      select 1 from public.tenants
      where tenants.id = leases.tenant_id
      and tenants.user_id = auth.uid()
    )
  );

-- Landlords can view leases for their properties
create policy "leases_select_landlord"
  on public.leases for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = leases.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Landlords can manage leases for their properties
create policy "leases_insert_landlord"
  on public.leases for insert
  with check (
    exists (
      select 1 from public.properties
      where properties.id = leases.property_id
      and properties.user_id = auth.uid()
    )
  );

create policy "leases_update_landlord"
  on public.leases for update
  using (
    exists (
      select 1 from public.properties
      where properties.id = leases.property_id
      and properties.user_id = auth.uid()
    )
  );

create index if not exists leases_property_id_idx on public.leases(property_id);
create index if not exists leases_tenant_id_idx on public.leases(tenant_id);

-- =============================================

-- 5. MAINTENANCE_REQUESTS TABLE
-- Work orders and maintenance tracking
create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  assigned_employee_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null,
  status text default 'pending' check (status in ('pending', 'open', 'in_progress', 'completed', 'cancelled')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  work_order_code text unique,
  photo_urls text[],
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

alter table public.maintenance_requests enable row level security;

-- Tenants can view their own requests
create policy "maintenance_requests_select_tenant"
  on public.maintenance_requests for select
  using (
    exists (
      select 1 from public.tenants
      where tenants.id = maintenance_requests.tenant_id
      and tenants.user_id = auth.uid()
    )
  );

-- Landlords can view requests for their properties
create policy "maintenance_requests_select_landlord"
  on public.maintenance_requests for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = maintenance_requests.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Tenants can create requests
create policy "maintenance_requests_insert_tenant"
  on public.maintenance_requests for insert
  with check (
    exists (
      select 1 from public.tenants
      where tenants.id = maintenance_requests.tenant_id
      and tenants.user_id = auth.uid()
    )
  );

-- Landlords can create requests for their properties
create policy "maintenance_requests_insert_landlord"
  on public.maintenance_requests for insert
  with check (
    exists (
      select 1 from public.properties
      where properties.id = maintenance_requests.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Landlords can update requests for their properties
create policy "maintenance_requests_update_landlord"
  on public.maintenance_requests for update
  using (
    exists (
      select 1 from public.properties
      where properties.id = maintenance_requests.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Assigned employees can view and update their assigned requests
create policy "maintenance_requests_select_employee"
  on public.maintenance_requests for select
  using (assigned_employee_id = auth.uid());

create policy "maintenance_requests_update_employee"
  on public.maintenance_requests for update
  using (assigned_employee_id = auth.uid());

create index if not exists maintenance_requests_property_id_idx on public.maintenance_requests(property_id);
create index if not exists maintenance_requests_tenant_id_idx on public.maintenance_requests(tenant_id);
create index if not exists maintenance_requests_status_idx on public.maintenance_requests(status);

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to auto-generate work order codes
create or replace function generate_work_order_code()
returns trigger as $$
begin
  new.work_order_code := 'WO-' || to_char(now(), 'YYYYMMDD') || '-' || substr(new.id::text, 1, 8);
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-generate work order codes
create trigger set_work_order_code
  before insert on public.maintenance_requests
  for each row
  when (new.work_order_code is null)
  execute function generate_work_order_code();

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at on all tables
create trigger update_properties_updated_at before update on public.properties
  for each row execute function update_updated_at_column();

create trigger update_units_updated_at before update on public.units
  for each row execute function update_updated_at_column();

create trigger update_tenants_updated_at before update on public.tenants
  for each row execute function update_updated_at_column();

create trigger update_leases_updated_at before update on public.leases
  for each row execute function update_updated_at_column();

create trigger update_maintenance_requests_updated_at before update on public.maintenance_requests
  for each row execute function update_updated_at_column();

-- =============================================
-- END OF SCHEMA
-- =============================================
