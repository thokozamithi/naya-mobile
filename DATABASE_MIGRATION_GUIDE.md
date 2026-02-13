# Database Migration Guide - Multi-Unit System

## Problem Summary
You encountered three schema cache errors:
1. **PGRST204**: `"Could not find the 'user_id' column of 'properties'"`
2. **PGRST205**: `"Could not find the table 'public.units'"`
3. **Tenants Error**: `"'public.tenants' does not exist"`

## Solution: Three Migration Files Created

### Option 1: Run All-in-One Migration (RECOMMENDED)
Use this single file for a complete fix:

```bash
supabase/migrations/20260213172000_complete_multi_unit_schema.sql
```

**This file:**
- ✅ Fixes properties table (owner_id → user_id)
- ✅ Adds missing columns (updated_at, photos, property_code)
- ✅ Recreates units table with complete schema
- ✅ Creates tenants table with complete schema
- ✅ Applies RLS policies to all three tables
- ✅ Creates indexes for performance
- ✅ Sets up triggers (property code generation, updated_at)
- ✅ Forces schema cache reload

### Option 2: Run Individual Migrations
If you prefer step-by-step:

1. **Properties + Units Fix:**
   ```bash
   supabase/migrations/20260213170000_complete_schema_fix.sql
   ```

2. **Tenants Table Fix:**
   ```bash
   supabase/migrations/20260213171000_add_tenants_table.sql
   ```

## How to Apply Migrations

### Using Supabase CLI (Local Development)

```bash
# Apply all pending migrations
supabase db push

# Or apply specific migration
supabase db push --file supabase/migrations/20260213172000_complete_multi_unit_schema.sql
```

### Using Supabase Dashboard (Production)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `20260213172000_complete_multi_unit_schema.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**
7. **WAIT 10 SECONDS** for schema cache to reload

## Verification Steps

After running the migration, test in this order:

### 1. Verify Tables Exist
```sql
-- Check all three tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('properties', 'units', 'tenants');
```

Expected: Should return 3 rows (properties, units, tenants)

### 2. Verify Properties Table Structure
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'properties'
AND column_name IN ('user_id', 'updated_at', 'photos', 'property_code');
```

Expected: Should return 4 rows with correct types

### 3. Verify Units Table Structure
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'units';
```

Expected: Should return 11 columns including bedrooms, bathrooms, square_feet, monthly_rent

### 4. Verify Tenants Table Structure
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tenants';
```

Expected: Should return 16 columns including user_id, property_id, unit_id, status, etc.

### 5. Test Create Property
In your app:
1. Go to "Add Property" screen
2. Fill in all required fields
3. Click "Add Property"
4. Should see success modal: "Property Created! 🏠"
5. No PGRST204 error

### 6. Test Add Unit
In your app:
1. Go to property details
2. Click "Manage Units"
3. Click "Add Unit" (or + button)
4. Fill in unit details
5. Click "Add Unit"
6. Should see success modal: "Unit Created! 🏢"
7. No PGRST205 error

### 7. Test Tenant Assignment (Future)
When you implement tenant joining:
1. Tenant enters property code
2. Selects available unit
3. Completes profile
4. Gets assigned to unit
5. No tenants table error

## What Each Table Does

### Properties Table
- Stores property information (address, type, total units)
- Uses `user_id` to link to landlord
- Auto-generates unique `property_code` for tenant joining
- Supports `photos` array for property images

### Units Table
- Stores individual units within a property
- Links to property via `property_id`
- Tracks status: vacant, occupied, maintenance, unavailable
- Stores unit details: bedrooms, bathrooms, square feet, monthly rent
- Unique `unit_code` within each property

### Tenants Table
- Stores tenant information
- Links to `auth.users` via `user_id` (tenant's account)
- Links to property via `property_id`
- Links to specific unit via `unit_id` (can be null if unassigned)
- Tracks tenant status: active, inactive, pending
- Stores lease dates and emergency contacts
- Constraint: only one active tenant per unit

## RLS (Row Level Security) Summary

### Properties
- Landlords can CRUD their own properties only
- Uses: `auth.uid() = user_id`

### Units
- Landlords can CRUD units in their properties
- Tenants can view their assigned unit
- Uses: join through properties table

### Tenants
- Tenants can view/update their own record
- Landlords can CRUD tenants in their properties
- Uses: join through properties table

## Troubleshooting

### If you still see "schema cache" errors after migration:

1. **Wait 10 seconds** after running migration (PostgREST needs time to reload)

2. **Manually reload schema:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **Restart your app:**
   ```bash
   # Kill and restart Metro bundler
   npm start -- --reset-cache
   ```

4. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('properties', 'units', 'tenants');
   ```

   All three should have `rowsecurity = true`

### If data doesn't appear:

1. **Check you're authenticated:**
   ```sql
   SELECT auth.uid(); -- Should return your user ID, not null
   ```

2. **Check data exists:**
   ```sql
   SELECT count(*) FROM public.properties;
   SELECT count(*) FROM public.units;
   SELECT count(*) FROM public.tenants;
   ```

3. **Check RLS policies:**
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE tablename IN ('properties', 'units', 'tenants');
   ```

## Next Steps After Migration

1. ✅ Run the all-in-one migration
2. ✅ Wait 10 seconds
3. ✅ Test creating a property (should see success modal)
4. ✅ Test adding units (should see success modal)
5. ⏳ Implement tenant joining workflow (tenants table now ready)
6. ⏳ Test complete flow: property → units → tenant assignment

## Files Modified
- `supabase/migrations/20260213170000_complete_schema_fix.sql` (properties + units)
- `supabase/migrations/20260213171000_add_tenants_table.sql` (tenants only)
- `supabase/migrations/20260213172000_complete_multi_unit_schema.sql` (ALL-IN-ONE)

Use the all-in-one file for easiest setup! 🎉
