-- =============================================
-- Migration: Fix Tenant Membership Sync
-- ROOT CAUSE: tenants table has RLS enabled but NO SELECT policy,
-- so the frontend query `SELECT * FROM tenants WHERE user_id = X`
-- returns 0 rows, causing the dashboard to always show "Not linked".
-- The join_unit_by_code RPC works because it's SECURITY DEFINER.
-- =============================================

-- STEP 1: Ensure tenants can read their own tenant record
drop policy if exists "tenants_select_own" on public.tenants;
create policy "tenants_select_own"
  on public.tenants for select
  using (auth.uid() = user_id);

-- STEP 2: Landlords can read tenants of their properties.
-- Uses a SECURITY DEFINER helper to avoid infinite recursion:
--   properties -> (policy queries) tenants -> (policy queries) properties -> loop
-- The helper bypasses RLS on `properties` to break the cycle.
create or replace function public.is_property_owner(p_property_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.properties
    where id = p_property_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

drop policy if exists "tenants_select_landlord" on public.tenants;
create policy "tenants_select_landlord"
  on public.tenants for select
  using (public.is_property_owner(property_id));

-- STEP 3: Ensure tenants can read their property
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

-- STEP 4: Ensure tenants can read their unit
drop policy if exists "units_select_tenant" on public.units;
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

-- STEP 5: Ensure grants are in place
grant select on public.tenants to authenticated;
grant select on public.properties to authenticated;
grant select on public.units to authenticated;
grant execute on function public.is_property_owner(uuid) to authenticated;

-- STEP 6: Reload PostgREST schema cache
notify pgrst, 'reload schema';

do $$ begin
  raise notice '=============================================';
  raise notice 'FIX APPLIED: tenants_select_own policy created';
  raise notice 'FIX APPLIED: tenants_select_landlord uses SECURITY DEFINER helper';
  raise notice 'No more infinite recursion on properties table';
  raise notice '=============================================';
end $$;
