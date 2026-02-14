-- =============================================
-- QUICK FIX: Allow tenants to view their property and unit
-- Run this in Supabase SQL Editor immediately
-- =============================================

-- Allow tenants to view the property they're joined to
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

-- Allow tenants to view the unit they're assigned to
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

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';

-- Done
do $$ begin
  raise notice '✅ Tenant RLS policies fixed - tenants can now view their property and unit';
end $$;
