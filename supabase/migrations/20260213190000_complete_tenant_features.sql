-- =============================================
-- Migration: Complete Tenant Features
-- - Add leave_unit RPC function
-- - Create messages table for tenant-landlord messaging
-- - Add RLS policies for messages
-- - Fix maintenance_requests RLS for tenants
-- =============================================

-- =============================================
-- PART 1: LEAVE UNIT RPC FUNCTION
-- =============================================

create or replace function leave_unit()
returns json as $$
declare
  v_user_id uuid;
  v_tenant record;
begin
  -- Get current user
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Find active tenant record
  select * into v_tenant
  from public.tenants
  where user_id = v_user_id
    and status = 'active';

  if v_tenant is null then
    return json_build_object('success', false, 'error', 'No active membership found');
  end if;

  -- Soft delete: set status to inactive
  update public.tenants
  set status = 'inactive',
      move_out_date = current_date,
      updated_at = now()
  where id = v_tenant.id;

  -- Update unit status back to vacant
  if v_tenant.unit_id is not null then
    update public.units
    set status = 'vacant',
        updated_at = now()
    where id = v_tenant.unit_id;
  end if;

  return json_build_object(
    'success', true,
    'message', 'Successfully left the unit'
  );
end;
$$ language plpgsql security definer;

-- Grant execute to authenticated users
grant execute on function leave_unit() to authenticated;

-- =============================================
-- PART 2: MESSAGES TABLE
-- =============================================

-- Drop if exists for clean recreation
drop table if exists public.messages cascade;

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

-- Indexes for performance
create index messages_property_id_idx on public.messages(property_id);
create index messages_unit_id_idx on public.messages(unit_id);
create index messages_sender_id_idx on public.messages(sender_id);
create index messages_receiver_id_idx on public.messages(receiver_id);
create index messages_created_at_idx on public.messages(created_at desc);
create index messages_is_read_idx on public.messages(is_read) where is_read = false;

-- =============================================
-- PART 3: RLS POLICIES FOR MESSAGES
-- =============================================

alter table public.messages enable row level security;

-- Users can view messages they sent or received
create policy "messages_select_own"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Tenants can send messages to landlord (property owner)
create policy "messages_insert_tenant"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.user_id = auth.uid()
        and t.status = 'active'
        and t.property_id = messages.property_id
        and (messages.receiver_id = p.user_id)
    )
  );

-- Landlords can send messages to their tenants
create policy "messages_insert_landlord"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.properties p
      join public.tenants t on t.property_id = p.id
      where p.user_id = auth.uid()
        and p.id = messages.property_id
        and t.user_id = messages.receiver_id
        and t.status = 'active'
    )
  );

-- Users can update messages they received (mark as read)
create policy "messages_update_receiver"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- =============================================
-- PART 4: FIX MAINTENANCE_REQUESTS RLS FOR TENANTS
-- =============================================

-- Drop existing tenant insert policy if exists
drop policy if exists "maintenance_requests_insert_tenant" on public.maintenance_requests;

-- Tenant can insert maintenance requests for their property
create policy "maintenance_requests_insert_tenant"
  on public.maintenance_requests for insert
  with check (
    exists (
      select 1 from public.tenants t
      where t.user_id = auth.uid()
        and t.status = 'active'
        and t.property_id = maintenance_requests.property_id
        and t.id = maintenance_requests.tenant_id
    )
  );

-- Add policy for tenant to view requests by property/unit
drop policy if exists "maintenance_requests_select_by_property" on public.maintenance_requests;
create policy "maintenance_requests_select_by_property"
  on public.maintenance_requests for select
  using (
    exists (
      select 1 from public.tenants t
      where t.user_id = auth.uid()
        and t.status = 'active'
        and t.property_id = maintenance_requests.property_id
    )
  );

-- =============================================
-- PART 5: PROPERTIES RLS - Allow tenants to view their property
-- =============================================

-- Drop and recreate tenant view policy for properties
drop policy if exists "properties_select_tenant" on public.properties;

create policy "properties_select_tenant"
  on public.properties for select
  using (
    exists (
      select 1 from public.tenants t
      where t.user_id = auth.uid()
        and t.status = 'active'
        and t.property_id = properties.id
    )
  );

-- =============================================
-- PART 6: UPDATED_AT TRIGGER FOR MESSAGES
-- =============================================

drop trigger if exists update_messages_updated_at on public.messages;
create trigger update_messages_updated_at
  before update on public.messages
  for each row
  execute function update_updated_at_column();

-- =============================================
-- PART 7: GRANT PERMISSIONS
-- =============================================

grant select, insert, update, delete on public.messages to authenticated;

-- =============================================
-- RELOAD SCHEMA CACHE
-- =============================================

notify pgrst, 'reload schema';

-- =============================================
-- SUCCESS
-- =============================================

do $$
begin
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ COMPLETE TENANT FEATURES MIGRATION APPLIED';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ leave_unit() RPC function created';
  raise notice '✅ messages table created with RLS';
  raise notice '✅ maintenance_requests RLS fixed for tenants';
  raise notice '✅ properties RLS allows tenant view';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
end $$;
