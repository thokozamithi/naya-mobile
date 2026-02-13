# Properties Table Rebuild - Test Plan

**Date**: 2026-02-13
**Purpose**: Verify properties table schema is correct and app functionality works
**Issue**: PGRST204 - PostgREST schema cache not recognizing columns

---

## Migration Applied
`20260213160000_rebuild_properties_schema.sql`

**What it does**:
1. Backs up existing properties to `properties_backup_20260213`
2. Drops and recreates properties table with complete schema
3. Restores existing data
4. Creates RLS policies (users can only access their own properties)
5. Creates indexes for performance
6. Creates property_code auto-generation trigger
7. Forces PostgREST to reload schema cache

---

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the entire contents of `supabase/migrations/20260213160000_rebuild_properties_schema.sql`
5. Paste into SQL Editor
6. Click **Run**
7. Wait for "Success" message
8. Wait 5-10 seconds for PostgREST to reload schema

### Option 2: Supabase CLI
```bash
cd "c:\Users\tk-ze\OneDrive\Documents\My App Dev\Naya-mobile"
npx supabase db push
```

If CLI says "Remote database is up to date", use Option 1 (Dashboard).

---

## Test Plan

### Pre-Test Checklist
- [ ] Migration has been applied successfully
- [ ] Waited 10 seconds after running migration
- [ ] App is running: `npm start`
- [ ] You are logged in as a landlord/builder user

---

### Test 1: Create Property - Success ✅

**Objective**: Verify property creation works without PGRST204 error

**Steps**:
1. Open app as landlord/builder
2. Navigate to Properties tab → Tap "+" button
3. Fill in the form:
   - Property Name: "Test Sunset Apartments"
   - Address: "123 Main St"
   - City: "Los Angeles"
   - State: "CA"
   - ZIP: "90001"
   - Property Type: Select "Apartment"
   - Total Units: "10"
   - Description: "Beautiful property with ocean views"
4. Tap "Add Property"

**Expected Results**:
- ✅ Success alert: "Property added successfully!"
- ✅ Navigates back to properties list
- ✅ New property appears in the list immediately
- ✅ Property has auto-generated property_code (e.g., "TES-1234")
- ✅ NO error about "description column"
- ✅ NO PGRST204 error

**If it fails**:
- Check Supabase logs for errors
- Verify migration was applied: Run `select column_name from information_schema.columns where table_name = 'properties';` in SQL Editor
- Ensure PostgREST reloaded: `notify pgrst, 'reload schema';`

---

### Test 2: Create Property Without Description ✅

**Objective**: Verify optional fields work

**Steps**:
1. Tap "+" to add another property
2. Fill in the form:
   - Property Name: "Oak Tower"
   - Address: "456 Oak Ave"
   - City: "San Francisco"
   - State: "CA"
   - ZIP: "94102"
   - Property Type: "Condo"
   - Total Units: "5"
   - Description: *Leave empty*
3. Tap "Add Property"

**Expected Results**:
- ✅ Success! Property created
- ✅ Description is NULL (not an error)
- ✅ Property appears in list
- ✅ Has property_code like "OAK-5678"

---

### Test 3: View Property Details ✅

**Objective**: Verify all fields are retrieved correctly

**Steps**:
1. Tap on "Test Sunset Apartments" from the properties list
2. Verify all details are displayed:
   - Property name
   - Address
   - City, State, ZIP
   - Property type
   - Total units
   - Description (if entered)
   - Property code card with QR button

**Expected Results**:
- ✅ All fields display correctly
- ✅ No missing data
- ✅ Property code displays in card format
- ✅ "Show QR Code" button is visible

---

### Test 4: Property Code Auto-Generation ✅

**Objective**: Verify trigger generates unique property codes

**Steps**:
1. Create a property named "Sunset Tower"
2. Check the property_code (should be like "SUN-1234")
3. Create another property named "Sunset Plaza"
4. Check the property_code (should be like "SUN-5678" - different number)

**Expected Results**:
- ✅ Both properties have property_code
- ✅ Codes start with "SUN-" (first 3 letters of name)
- ✅ Codes have different 4-digit numbers
- ✅ No duplicate property_code errors

---

### Test 5: RLS - User Isolation ✅

**Objective**: Verify users cannot see other users' properties

**Steps**:
1. As User A (landlord):
   - Create a property "User A Property"
   - Note the property_code (e.g., "USE-1111")
2. Log out and log in as User B (different landlord/builder)
3. Navigate to Properties tab
4. Try to view properties list

**Expected Results**:
- ✅ User B sees only their own properties
- ✅ User B does NOT see "User A Property"
- ✅ No permission errors, just an empty list (if User B has no properties)

**Additional Check**:
1. As User B, try to join User A's property as a tenant:
   - Go to tenant view
   - Tap "Join Property"
   - Enter User A's property code: "USE-1111"
   - Tap "Join Property"

**Expected**:
- ✅ User B can find the property (tenants can look up any property by code)
- ✅ User B joins as a tenant successfully
- This is correct behavior: property codes are meant to be shared

---

### Test 6: Refresh After Creation ✅

**Objective**: Verify property persists and appears after app refresh

**Steps**:
1. Create a new property "Refresh Test Building"
2. Note the property_code
3. Pull to refresh on the properties list
4. Close and reopen the app
5. Navigate to Properties tab

**Expected Results**:
- ✅ Property still appears after refresh
- ✅ Property still appears after app restart
- ✅ All data is intact (name, address, property_code, etc.)

---

### Test 7: QR Code Generation & Scanning ✅

**Objective**: Verify QR code features work with new schema

**Steps**:
1. Open a property detail screen
2. Tap "Show QR Code" button
3. Verify QR code modal displays with property_code
4. Close modal
5. Open app on a second device (or use same device as tenant)
6. Go to "Join Property" screen
7. Tap "📷 Scan" button
8. Grant camera permission (if first time)
9. Scan the QR code from the first device

**Expected Results**:
- ✅ QR code displays correctly with property_code
- ✅ Camera scanner opens
- ✅ QR code scans successfully
- ✅ Property code auto-fills in input field
- ✅ Alert: "QR Code Scanned - Property code: XXX-1234"
- ✅ Can join property successfully

---

### Test 8: Query Performance ✅

**Objective**: Verify indexes are working

**Steps**:
1. In Supabase Dashboard → SQL Editor, run:
```sql
explain analyze
select * from public.properties
where user_id = 'paste-your-user-id-here'
order by created_at desc;
```

**Expected Results**:
- ✅ Query plan shows "Index Scan using properties_user_id_idx"
- ✅ Execution time < 10ms (for small datasets)
- ✅ No "Seq Scan" (sequential scan) on properties table

---

### Test 9: Updated_at Trigger ✅

**Objective**: Verify timestamp updates automatically

**Steps**:
1. Create a property
2. Note the created_at and updated_at timestamps (should be equal)
3. Edit the property (change name or description)
4. Check the updated_at timestamp

**Expected Results**:
- ✅ created_at remains unchanged
- ✅ updated_at is now later than created_at
- ✅ Automatic timestamp update works

---

### Test 10: Data Migration ✅

**Objective**: Verify existing properties were migrated correctly

**Steps**:
1. In Supabase Dashboard → SQL Editor:
```sql
-- Check if backup exists and has data
select count(*) from public.properties_backup_20260213;

-- Compare counts
select
  (select count(*) from public.properties) as current_count,
  (select count(*) from public.properties_backup_20260213) as backup_count;
```

**Expected Results**:
- ✅ Backup table exists
- ✅ counts match (or current_count >= backup_count if you created new properties)
- ✅ All property data is intact

---

## Rollback Plan (If Tests Fail)

**If migration causes issues**:

```sql
-- Restore from backup
drop table if exists public.properties cascade;

alter table public.properties_backup_20260213
  rename to properties;

-- Re-enable RLS
alter table public.properties enable row level security;

-- Recreate policies (copy from original migration)
-- ... (policies from 20260213060641_core_tables.sql)

-- Reload schema
notify pgrst, 'reload schema';
```

---

## Success Criteria

All tests must pass:
- ✅ Test 1: Property creation works without errors
- ✅ Test 2: Optional fields (description) work
- ✅ Test 3: All fields retrieve correctly
- ✅ Test 4: Property codes auto-generate uniquely
- ✅ Test 5: RLS isolates users correctly
- ✅ Test 6: Data persists after refresh
- ✅ Test 7: QR codes work end-to-end
- ✅ Test 8: Indexes improve performance
- ✅ Test 9: Timestamps update automatically
- ✅ Test 10: Existing data migrated successfully

---

## Post-Test Actions

Once all tests pass:
1. Remove the temporary workaround in `AddPropertyScreen.tsx`:
   - Delete lines 69-85 (the propertyData workaround)
   - Restore original code:
   ```typescript
   await createProperty.mutateAsync({
     user_id: user.id,
     name: name.trim(),
     address: address.trim(),
     city: city.trim(),
     state: state.trim(),
     zip: zip.trim(),
     property_type: propertyType,
     total_units: parseInt(totalUnits),
     description: description.trim() || null,
   });
   ```

2. Test again to ensure it still works without workaround

3. Mark P1 session complete!

---

## Troubleshooting

### Issue: Still getting PGRST204 error

**Solution**:
1. Verify migration ran successfully:
```sql
select * from information_schema.columns
where table_name = 'properties'
order by ordinal_position;
```
Expected columns: id, user_id, name, address, city, state, zip, property_type, total_units, description, photos, property_code, created_at, updated_at

2. Force PostgREST reload:
```sql
notify pgrst, 'reload schema';
```

3. Wait 10 seconds and try again

### Issue: Migration fails with "relation already exists"

**Solution**:
The migration uses `if not exists` but if you need to force it:
```sql
-- Manually drop everything first
drop table if exists public.properties cascade;
drop table if exists public.properties_backup_20260213;
-- Then run the migration
```

### Issue: RLS blocking my queries

**Solution**:
Ensure you're logged in and your role is 'landlord' or 'builder':
```sql
-- Check your user_id and role
select auth.uid(), (select user_metadata->>'activeRole' from auth.users where id = auth.uid());
```

---

## Summary

**Status**: Ready to test
**Migration**: `20260213160000_rebuild_properties_schema.sql`
**App Workaround**: Already applied in `AddPropertyScreen.tsx` (temporary)
**Next Steps**:
1. Apply migration via Dashboard or CLI
2. Run all 10 tests
3. If all pass, remove app workaround
4. Mark schema rebuild complete! ✅

---

**Questions?**
Check Supabase logs: Dashboard → Logs → Postgres logs
Check PostgREST logs: Dashboard → Logs → API logs
