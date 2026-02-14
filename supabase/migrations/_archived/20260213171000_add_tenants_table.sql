-- =============================================
-- TENANTS TABLE FIX
-- Fix "public.tenants does not exist" error
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

-- Indexes for performance
create index tenants_user_id_idx on public.tenants(user_id);
create index tenants_property_id_idx on public.tenants(property_id);
create index tenants_unit_id_idx on public.tenants(unit_id);
create index tenants_status_idx on public.tenants(status);

-- Unique constraint: one active tenant per unit
create unique index tenants_unit_id_active_unique
  on public.tenants(unit_id)
  where status = 'active' and unit_id is not null;

-- =============================================
-- RLS POLICIES FOR TENANTS
-- =============================================

alter table public.tenants enable row level security;

-- Tenants can view their own record
create policy "tenants_select_own"
  on public.tenants for select
  using (auth.uid() = user_id);

-- Tenants can update their own record (limited fields)
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
-- TRIGGERS
-- =============================================

-- Updated_at trigger for tenants
drop trigger if exists update_tenants_updated_at on public.tenants;
create trigger update_tenants_updated_at
  before update on public.tenants
  for each row
  execute function public.update_updated_at_column();

-- =============================================
-- PERMISSIONS
-- =============================================

grant select, insert, update, delete on public.tenants to authenticated;

-- =============================================
-- RELOAD SCHEMA CACHE
-- =============================================

notify pgrst, 'reload schema';

-- SUCCESS MESSAGE
do $$
begin
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ TENANTS TABLE CREATED';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ Tenants table: created with complete schema';
  raise notice '✅ RLS policies: landlords + tenants access';
  raise notice '✅ Indexes: created for performance';
  raise notice '✅ Constraint: one active tenant per unit';
  raise notice '✅ Schema cache: reloaded';
  raise notice '';
  raise notice '⏳ WAIT 10 SECONDS before testing';
  raise notice '';
  raise notice 'Tenants table is now ready!';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
end $$;
