-- Fix maintenance_requests.assigned_employee_id to reference employees.id
-- Date: 2026-02-13

-- Ensure FK points at public.employees(id)
do $$
begin
  if to_regclass('public.maintenance_requests') is not null then
    alter table public.maintenance_requests
      drop constraint if exists maintenance_requests_assigned_employee_id_fkey;

    alter table public.maintenance_requests
      add constraint maintenance_requests_assigned_employee_id_fkey
      foreign key (assigned_employee_id)
      references public.employees(id)
      on delete set null;
  end if;
end $$;

notify pgrst, 'reload schema';
