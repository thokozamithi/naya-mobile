-- Add RLS policy for employees to see maintenance requests assigned to them
-- Date: 2026-02-13

-- Employee can view maintenance requests assigned to them
do $$
begin
  if to_regclass('public.maintenance_requests') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'maintenance_requests'
        and policyname = 'maintenance_requests_select_employee'
    ) then
      create policy "maintenance_requests_select_employee" on public.maintenance_requests
        for select using (
          exists (
            select 1 from public.employees e
            where e.id = maintenance_requests.assigned_employee_id
              and e.user_id = auth.uid()
          )
        );
    end if;
  end if;
end $$;

notify pgrst, 'reload schema';
