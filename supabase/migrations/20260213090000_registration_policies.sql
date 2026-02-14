-- Registration support policies and helpers
-- Date: 2026-02-13

-- Helper: verify landlord role (security definer to bypass RLS on user_roles)
create or replace function public.is_landlord(p_user_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = p_user_id
      and role = 'landlord'
  );
$$ language sql security definer stable;

grant execute on function public.is_landlord(uuid) to authenticated;

-- Tenants can insert their own record (required for join_unit_by_code)
do $$
begin
  if to_regclass('public.tenants') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'tenants'
        and policyname = 'tenants_insert_own'
    ) then
      create policy "tenants_insert_own" on public.tenants
        for insert with check (auth.uid() = user_id);
    end if;
  end if;
end $$;

-- Employees can self-insert when linking to a valid landlord
-- Requires landlord_id to be a landlord role user

do $$
begin
  if to_regclass('public.employees') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'employees'
        and policyname = 'employees_insert_own'
    ) then
      create policy "employees_insert_own" on public.employees
        for insert with check (auth.uid() = user_id and public.is_landlord(landlord_id));
    end if;
  end if;
end $$;
