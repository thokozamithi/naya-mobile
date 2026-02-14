-- =============================================
-- Migration: Add maintenance_requests table
-- Date: 2026-02-14
-- Purpose: Enable tenants to submit and landlords to manage maintenance requests
-- =============================================

-- Drop if exists (for clean re-runs)
drop table if exists public.maintenance_requests cascade;

-- =============================================
-- CREATE MAINTENANCE_REQUESTS TABLE
-- =============================================
create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  
  -- Relationships
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  assigned_employee_id uuid references auth.users(id) on delete set null,
  
  -- Request details
  title text not null,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'open', 'in_progress', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'emergency')),
  
  -- Media and notes
  photo_urls text[],
  notes text,
  
  -- Tracking
  work_order_code text unique,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Indexes for performance
create index maintenance_requests_property_id_idx on public.maintenance_requests(property_id);
create index maintenance_requests_unit_id_idx on public.maintenance_requests(unit_id);
create index maintenance_requests_tenant_id_idx on public.maintenance_requests(tenant_id);
create index maintenance_requests_status_idx on public.maintenance_requests(status);
create index maintenance_requests_priority_idx on public.maintenance_requests(priority);
create index maintenance_requests_created_at_idx on public.maintenance_requests(created_at desc);

-- =============================================
-- HELPER FUNCTION: Check if user is tenant who submitted request
-- =============================================
create or replace function public.is_request_tenant(p_request_id uuid)
returns boolean as $$
  select exists (
    select 1 
    from public.maintenance_requests mr
    join public.tenants t on t.id = mr.tenant_id
    where mr.id = p_request_id 
      and t.user_id = auth.uid()
  );
$$ language sql security definer stable;

-- =============================================
-- HELPER FUNCTION: Check if user owns property of the request
-- =============================================
create or replace function public.is_request_property_owner(p_request_id uuid)
returns boolean as $$
  select exists (
    select 1 
    from public.maintenance_requests mr
    join public.properties p on p.id = mr.property_id
    where mr.id = p_request_id 
      and p.user_id = auth.uid()
  );
$$ language sql security definer stable;

-- =============================================
-- RLS POLICIES
-- =============================================
alter table public.maintenance_requests enable row level security;

-- Tenant can view their own requests (submitted by them)
create policy "maintenance_requests_select_tenant" on public.maintenance_requests
  for select using (
    exists (
      select 1 from public.tenants t
      where t.id = maintenance_requests.tenant_id
        and t.user_id = auth.uid()
    )
  );

-- Tenant can insert requests for properties they belong to
create policy "maintenance_requests_insert_tenant" on public.maintenance_requests
  for insert with check (
    exists (
      select 1 from public.tenants t
      where t.id = maintenance_requests.tenant_id
        and t.user_id = auth.uid()
        and t.status = 'active'
        and t.property_id = maintenance_requests.property_id
    )
  );

-- Landlord can view all requests for their properties
create policy "maintenance_requests_select_landlord" on public.maintenance_requests
  for select using (public.is_property_owner(property_id));

-- Landlord can update requests for their properties (change status, assign employee, add notes)
create policy "maintenance_requests_update_landlord" on public.maintenance_requests
  for update using (public.is_property_owner(property_id));

-- Landlord can delete requests for their properties
create policy "maintenance_requests_delete_landlord" on public.maintenance_requests
  for delete using (public.is_property_owner(property_id));

-- =============================================
-- TRIGGER: Auto-generate work order code
-- =============================================
create or replace function generate_work_order_code()
returns text as $$
declare new_code text;
begin
  loop
    -- Format: WO-XXXXX (5 random alphanumeric)
    new_code := 'WO-' || upper(
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      lpad(floor(random() * 1000)::text, 3, '0')
    );
    if not exists(select 1 from public.maintenance_requests where work_order_code = new_code) then
      return new_code;
    end if;
  end loop;
end;
$$ language plpgsql;

create or replace function set_work_order_code()
returns trigger as $$
begin
  if new.work_order_code is null then
    new.work_order_code := generate_work_order_code();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger maintenance_requests_work_order_trigger
  before insert on public.maintenance_requests
  for each row execute function set_work_order_code();

-- Updated_at trigger
create trigger update_maintenance_requests_updated_at
  before update on public.maintenance_requests
  for each row execute function public.update_updated_at_column();

-- =============================================
-- GRANTS
-- =============================================
grant select, insert, update, delete on public.maintenance_requests to authenticated;
grant execute on function public.is_request_tenant(uuid) to authenticated;
grant execute on function public.is_request_property_owner(uuid) to authenticated;

-- =============================================
-- RELOAD SCHEMA CACHE
-- =============================================
notify pgrst, 'reload schema';

-- Done
do $$ begin
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ MAINTENANCE_REQUESTS TABLE CREATED';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ Table with: property_id, unit_id, tenant_id';
  raise notice '✅ Status: pending, open, in_progress, completed, cancelled';
  raise notice '✅ Priority: low, medium, high, emergency';
  raise notice '✅ Auto-generated work_order_code (WO-XXXXX)';
  raise notice '✅ RLS: Tenants insert/view own, Landlords view/update/delete all';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
end $$;
