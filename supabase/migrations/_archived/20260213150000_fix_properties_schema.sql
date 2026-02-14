-- Fix properties description column if missing
-- This ensures the description column exists and refreshes the schema cache

-- Add description column if it doesn't exist
alter table public.properties
add column if not exists description text;

-- Also ensure photos column exists
alter table public.properties
add column if not exists photos text[];

-- Send notification to PostgREST to reload schema
notify pgrst, 'reload schema';
