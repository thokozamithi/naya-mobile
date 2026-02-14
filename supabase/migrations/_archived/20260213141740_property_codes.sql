-- Add property_code column to properties table
alter table public.properties add column if not exists property_code text unique;

-- Create function to generate property code
create or replace function generate_property_code(property_name text)
returns text
language plpgsql
as $$
declare
  prefix text;
  code text;
  code_exists boolean;
begin
  -- Extract first 3 letters from property name (uppercase, alphanumeric only)
  prefix := upper(regexp_replace(substring(property_name from 1 for 3), '[^A-Za-z0-9]', '', 'g'));

  -- If prefix is too short, pad with 'X'
  while length(prefix) < 3 loop
    prefix := prefix || 'X';
  end loop;

  -- Try to generate a unique code (max 10 attempts)
  for i in 1..10 loop
    -- Generate 4 random digits
    code := prefix || '-' || lpad(floor(random() * 10000)::text, 4, '0');

    -- Check if code already exists
    select exists(select 1 from public.properties where property_code = code) into code_exists;

    if not code_exists then
      return code;
    end if;
  end loop;

  -- If we couldn't generate a unique code, append timestamp
  return prefix || '-' || lpad(extract(epoch from now())::bigint::text, 4, '0');
end;
$$;

-- Create trigger function to auto-generate property code on insert
create or replace function set_property_code()
returns trigger
language plpgsql
as $$
begin
  -- Only generate if property_code is null
  if new.property_code is null then
    new.property_code := generate_property_code(new.name);
  end if;
  return new;
end;
$$;

-- Create trigger to call the function before insert
drop trigger if exists trigger_set_property_code on public.properties;
create trigger trigger_set_property_code
  before insert on public.properties
  for each row
  execute function set_property_code();

-- Backfill existing properties with codes
update public.properties
set property_code = generate_property_code(name)
where property_code is null;

-- Create index on property_code for fast lookups
create index if not exists properties_property_code_idx on public.properties(property_code);

-- Comment
comment on column public.properties.property_code is 'Friendly property code for tenant joining (e.g., "SUN-1234")';
