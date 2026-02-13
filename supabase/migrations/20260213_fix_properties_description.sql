-- Ensure properties table has description column
-- This fixes schema cache issues

alter table public.properties
add column if not exists description text;

-- Refresh schema cache
notify pgrst, 'reload schema';
