-- Landlord shareable codes
-- Date: 2026-02-13

-- Ensure profiles table exists
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  bio text,
  landlord_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add landlord_code column if missing
alter table public.profiles add column if not exists landlord_code text;

-- Unique index on landlord_code
create unique index if not exists profiles_landlord_code_unique on public.profiles(landlord_code) where landlord_code is not null;

-- RLS policies for profiles (safe if already exist)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_own'
  ) then
    alter table public.profiles enable row level security;
    create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
    create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
    create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

-- Updated_at trigger
create or replace function public.update_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'update_profiles_updated_at'
  ) then
    create trigger update_profiles_updated_at before update on public.profiles
      for each row execute function public.update_profiles_updated_at();
  end if;
end $$;

-- Generate a unique landlord code
create or replace function public.generate_landlord_code()
returns text as $$
declare
  candidate text;
  attempts int := 0;
begin
  loop
    attempts := attempts + 1;
    candidate := 'LND-' || upper(substring(md5(random()::text) from 1 for 8));
    if not exists (select 1 from public.profiles where landlord_code = candidate) then
      return candidate;
    end if;
    if attempts > 25 then
      raise exception 'Failed to generate unique landlord code';
    end if;
  end loop;
end;
$$ language plpgsql security definer;

grant execute on function public.generate_landlord_code() to authenticated;

-- Resolve landlord code to user id
create or replace function public.resolve_landlord_code(p_code text)
returns uuid as $$
  select id
  from public.profiles
  where landlord_code = upper(trim(p_code))
  limit 1;
$$ language sql security definer stable;

grant execute on function public.resolve_landlord_code(text) to authenticated;
