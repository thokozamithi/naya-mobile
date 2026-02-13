# Supabase Setup Instructions

## Problem Summary

The app was experiencing a **404 error** when trying to insert user roles into the `user_roles` table. This happened because:

1. The migration file existed locally but was never applied to the Supabase database
2. The table doesn't exist on your Supabase instance yet

## Solution

You need to run the migration file to create the `user_roles` table in your Supabase database.

## Steps to Fix

### Option 1: Run Migration via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `hrttckaqykjglypwayej` (or your project name)
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `supabase/migrations/20250212_create_user_roles.sql` from this repo
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. You should see a success message: "Success. No rows returned"

### Option 2: Run Migration via Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref hrttckaqykjglypwayej

# Run pending migrations
supabase db push
```

### Option 3: Manual SQL Execution

Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Create user_roles table in public schema
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('tenant','landlord','builder','specialist','employee','admin')),
  created_at timestamptz default now()
);

alter table public.user_roles enable row level security;

-- Users can view their own roles
create policy if not exists "user_roles_select_own"
  on public.user_roles
  for select
  using (auth.uid() = user_id);

-- Users can insert their own roles
create policy if not exists "user_roles_insert_own"
  on public.user_roles
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own roles
create policy if not exists "user_roles_update_own"
  on public.user_roles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own roles
create policy if not exists "user_roles_delete_own"
  on public.user_roles
  for delete
  using (auth.uid() = user_id);
```

## Verify the Setup

After running the migration:

1. Go to **Table Editor** in Supabase Dashboard
2. Look for the `user_roles` table in the public schema
3. You should see columns: `id`, `user_id`, `role`, `created_at`
4. Check the **Policies** tab - you should see 4 RLS policies

## What This Migration Does

- Creates a `user_roles` table to store user role assignments
- Enables Row Level Security (RLS) to ensure users can only access their own roles
- Sets up policies allowing users to:
  - View their own roles
  - Add new roles to themselves
  - Update their own roles
  - Delete their own roles
- Supports 6 role types: `tenant`, `landlord`, `builder`, `specialist`, `employee`, `admin`

## Next Steps

After applying the migration:

1. Restart your Expo app
2. Try signing up or selecting a role
3. The 404 error should be gone
4. Roles will now persist in the database instead of just locally

## Troubleshooting

### Still getting 404 errors?

1. Double-check the table exists: Go to Table Editor → check for `user_roles`
2. Verify your environment variables in `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL` should be set
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` should be set
3. Clear app data and restart: Stop Expo → Clear cache → Start again

### RLS Policy Issues?

If you can't insert/select roles:
- Make sure you're authenticated (signed in)
- Check that `auth.uid()` matches the `user_id` being inserted
- Review policies in Supabase Dashboard → Authentication → Policies

### Migration Already Exists Error?

If you see "relation already exists":
- The table is already created (good!)
- You can safely ignore this error
- The migration uses `create table if not exists` to be idempotent
