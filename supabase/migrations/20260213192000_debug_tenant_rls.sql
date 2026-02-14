-- =============================================
-- DEBUG & FIX: Tenant View Issues
-- Run in Supabase SQL Editor
-- =============================================

-- STEP 1: Check existing tenant records
select 'TENANT RECORDS' as debug_step;
select 
  t.id,
  t.user_id,
  t.property_id,
  t.unit_id,
  t.status,
  t.full_name,
  t.created_at
from public.tenants t
order by t.created_at desc
limit 10;

-- STEP 2: Check existing RLS policies
select 'RLS POLICIES' as debug_step;
select tablename, policyname, permissive, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('tenants', 'properties', 'units')
order by tablename, policyname;

-- STEP 3: FIX - Recreate all tenant-related RLS policies
-- Drop existing conflicting policies
drop policy if exists "tenants_select_own" on public.tenants;
drop policy if exists "properties_select_tenant" on public.properties;
drop policy if exists "units_select_tenant" on public.units;

-- Tenants can read their own tenant record
create policy "tenants_select_own"
  on public.tenants for select
  using (auth.uid() = user_id);

-- Tenants can read their property
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

-- Tenants can read their unit
create policy "units_select_tenant"
  on public.units for select
  using (
    exists (
      select 1 from public.tenants t
      where t.user_id = auth.uid()
        and t.status = 'active'
        and t.unit_id = units.id
    )
  );

-- STEP 4: Ensure grants are in place
grant select, insert, update, delete on public.tenants to authenticated;
grant select on public.properties to authenticated;
grant select on public.units to authenticated;

-- Reload PostgREST schema
notify pgrst, 'reload schema';

-- STEP 5: Verify fix - show policies again
select 'POLICIES AFTER FIX' as debug_step;
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('tenants', 'properties', 'units')
  and (policyname like '%tenant%' or policyname like '%own%')
order by tablename;

-- Done
do $$ begin
  raise notice '✅ Debug complete. Check results above.';
  raise notice '✅ RLS policies recreated for tenants, properties, units';
  raise notice '🔄 Now force-close and reopen your app to refresh data';
end $$;
