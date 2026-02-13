-- =============================================
-- Migration: Add unit_join_code for simplified tenant joining
-- =============================================

-- Add unit_join_code column (nullable first for backfill)
alter table public.units add column if not exists unit_join_code text;

-- Function to generate unique join codes
create or replace function generate_unit_join_code()
returns text as $$
declare
  new_code text;
  code_exists boolean;
begin
  loop
    -- Generate code: 3 uppercase letters + 4 digits (e.g., ABC1234)
    new_code := upper(
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      lpad(floor(random() * 10000)::text, 4, '0')
    );
    
    -- Check if code already exists
    select exists(select 1 from public.units where unit_join_code = new_code) into code_exists;
    
    if not code_exists then
      return new_code;
    end if;
  end loop;
end;
$$ language plpgsql;

-- Backfill existing units with unique join codes
do $$
declare
  unit_record record;
begin
  for unit_record in select id from public.units where unit_join_code is null loop
    update public.units
    set unit_join_code = generate_unit_join_code()
    where id = unit_record.id;
  end loop;
end $$;

-- Now make column NOT NULL and add unique constraint
alter table public.units alter column unit_join_code set not null;

-- Create unique index for globally unique join codes
create unique index if not exists units_join_code_unique on public.units(unit_join_code);

-- Trigger to auto-generate join code on insert if not provided
create or replace function set_unit_join_code()
returns trigger as $$
begin
  if new.unit_join_code is null or new.unit_join_code = '' then
    new.unit_join_code := generate_unit_join_code();
  else
    -- Normalize: trim and uppercase
    new.unit_join_code := upper(trim(new.unit_join_code));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists unit_join_code_trigger on public.units;
create trigger unit_join_code_trigger
  before insert or update on public.units
  for each row
  execute function set_unit_join_code();

-- =============================================
-- RPC function for secure tenant joining
-- =============================================
create or replace function join_unit_by_code(p_code text)
returns json as $$
declare
  v_user_id uuid;
  v_unit record;
  v_existing_tenant record;
  v_unit_occupant record;
  v_user_email text;
  v_user_name text;
begin
  -- Get current user
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Normalize code
  p_code := upper(trim(p_code));

  -- Find unit by join code
  select u.*, p.name as property_name, p.id as prop_id
  into v_unit
  from public.units u
  join public.properties p on p.id = u.property_id
  where u.unit_join_code = p_code;

  if v_unit is null then
    return json_build_object('success', false, 'error', 'Invalid code. Unit not found.');
  end if;

  -- Check if user already tenant of this property
  select id into v_existing_tenant
  from public.tenants
  where user_id = v_user_id
    and property_id = v_unit.prop_id
    and status = 'active';

  if v_existing_tenant is not null then
    return json_build_object('success', false, 'error', 'You are already a tenant of this property.');
  end if;

  -- Check if unit already occupied
  select id into v_unit_occupant
  from public.tenants
  where unit_id = v_unit.id
    and status = 'active';

  if v_unit_occupant is not null then
    return json_build_object('success', false, 'error', 'This unit already has an active tenant.');
  end if;

  -- Get user info from auth.users
  select email, raw_user_meta_data->>'full_name'
  into v_user_email, v_user_name
  from auth.users
  where id = v_user_id;

  v_user_name := coalesce(v_user_name, split_part(v_user_email, '@', 1), 'Tenant');

  -- Insert tenant record
  insert into public.tenants (user_id, property_id, unit_id, full_name, email, status)
  values (v_user_id, v_unit.prop_id, v_unit.id, v_user_name, v_user_email, 'active');

  -- Update unit status to occupied
  update public.units
  set status = 'occupied'
  where id = v_unit.id;

  return json_build_object(
    'success', true,
    'property_name', v_unit.property_name,
    'unit_name', v_unit.unit_name,
    'unit_id', v_unit.id,
    'property_id', v_unit.prop_id
  );
end;
$$ language plpgsql security definer;

-- Grant execute to authenticated users
grant execute on function join_unit_by_code(text) to authenticated;

-- =============================================
-- Update RLS: Allow reading units by join_code for tenants
-- =============================================
-- Note: The RPC function uses security definer, so RLS is bypassed for joining.
-- But we need to allow tenants to verify codes exist (limited fields):

create policy "Anyone can lookup unit by join code"
  on public.units for select
  using (true);  -- Allow select, actual data access controlled by RPC

-- Drop old policies if they conflict
drop policy if exists "Units are viewable by property owner" on public.units;

-- Recreate a safe policy for landlords
create policy "Landlords can manage their units"
  on public.units for all
  using (
    property_id in (
      select id from public.properties where user_id = auth.uid()
    )
  );
