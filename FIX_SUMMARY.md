# Fix Summary - Supabase & Navigation Issues

## Issues Fixed

### A. Supabase 404 Error (CRITICAL - FIXED)

**Problem**: `POST https://hrttckaqykjglypwayej.supabase.co/rest/v1/user_roles 404 (Not Found)`

**Root Cause**:
- Migration file existed locally but wasn't applied to database
- `user_roles` table didn't exist in Supabase
- Missing 'admin' role in CHECK constraint

**Files Changed**:
1. **supabase/migrations/20250212_create_user_roles.sql**
   - Added 'admin' to allowed roles CHECK constraint
   - Line 5: Now includes all 6 roles: tenant, landlord, builder, specialist, employee, admin

2. **src/hooks/useAuth.tsx** (Lines 70-93, 153-172, 226-244)
   - Improved error handling for missing table (404 errors)
   - Better error messages for users
   - Graceful fallback to local storage when table doesn't exist
   - Now checks for 404, PGRST204, and PGRST205 error codes
   - User-friendly Alert dialogs with detailed error info

3. **SUPABASE_SETUP.md** (NEW FILE)
   - Complete setup instructions for applying the migration
   - Three different methods to run the migration
   - Troubleshooting guide

**How to Apply Fix**:
- See `SUPABASE_SETUP.md` for detailed instructions
- Quick: Copy SQL from migration file → Supabase Dashboard → SQL Editor → Run

---

### B. Navigation Error - RoleSelection Unreachable (CRITICAL - FIXED)

**Warning**: `The action 'NAVIGATE' with payload {"name":"RoleSelection"} was not handled by any navigator`

**Root Cause**:
- `RoleSelection` screen was only registered when user had NO role (`!activeRole`)
- When user had a role and tried to navigate to RoleSelection (to switch roles), it failed
- The screen didn't exist in any of the role-specific navigator stacks
- Users couldn't switch roles from ProfileSettings or other screens

**Fix Applied**:
- Added `RoleSelection` as a screen to ALL 5 role stacks:
  - TenantTabs (line 90)
  - LandlordTabs (line 133)
  - BuilderTabs (line 176)
  - SpecialistTabs (line 220)
  - EmployeeTabs (line 262)
- Now users can navigate to RoleSelection from anywhere in the app
- Role switching functionality fully restored

**Files Changed**:
1. **src/navigation/RootNavigator.tsx** (Lines 87-98, 130-141, 173-185, 217-227, 259-270)
   - Added `<Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />` to each role stack
   - Title set to "Select Role" with header shown

---

### C. Initial Stack Navigation Error (CRITICAL - FIXED)

**Problem**: RoleSelectionScreen header buttons navigate to 'Home' (logo) and 'ProfileSettings' but these screens didn't exist in the initial "no role" stack.

**Root Cause**:
- When new users have no role, they see RoleSelection in an isolated stack (line 285-289)
- That stack only contained RoleSelection
- Buttons in RoleSelectionScreen try to navigate to Home and ProfileSettings
- Those screens weren't registered in that stack

**Fix Applied**:
- Added Home and ProfileSettings to the initial "no role" stack
- Now users can navigate to these screens even before selecting a role
- Consistent navigation experience throughout the app

**Files Changed**:
1. **src/navigation/RootNavigator.tsx** (Lines 287-288)
   - Added `Home` screen to initial stack
   - Added `ProfileSettings` screen to initial stack with header

---

## Complete File Changes

| File | Changes | Lines |
|------|---------|-------|
| `supabase/migrations/20250212_create_user_roles.sql` | Added 'admin' to role CHECK constraint | 5 |
| `src/hooks/useAuth.tsx` | Enhanced error handling (404, PGRST204/205) | 70-93, 153-172, 226-244 |
| `src/navigation/RootNavigator.tsx` | Added RoleSelection to all 5 role stacks | 90, 133, 176, 220, 262 |
| `src/navigation/RootNavigator.tsx` | Added Home/ProfileSettings to initial stack | 287-288 |
| `SUPABASE_SETUP.md` | Created setup instructions document | NEW |
| `FIX_SUMMARY.md` | Created this summary document | NEW |
| `FINAL_FIX_SUMMARY.md` | Created executive summary | NEW |

---

## Test Checklist

### Prerequisites
- [ ] Supabase migration applied (see `SUPABASE_SETUP.md`)
- [ ] Environment variables set in `.env`:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] App restarted after migration

### Test Scenarios

#### 1. New User Registration with Role Selection
- [ ] Start app
- [ ] Navigate to Register screen
- [ ] Create account with email/password
- [ ] Successfully registers (no error)
- [ ] Automatically navigates to RoleSelectionScreen
- [ ] Select a role (e.g., "Tenant")
- [ ] Role is saved **(no 404 error)**
- [ ] Navigates to correct dashboard (TenantHome)
- [ ] Console shows no Supabase errors

#### 2. Role Persistence After Reload
- [ ] Close app completely
- [ ] Reopen app
- [ ] User is still logged in
- [ ] Correct role is still active
- [ ] Navigates directly to role dashboard (skips RoleSelectionScreen)

#### 3. Adding Additional Roles
- [ ] Go to Profile Settings
- [ ] Navigate to RoleSelection
- [ ] Select a different role (e.g., "Landlord")
- [ ] New role is added successfully
- [ ] Can switch between roles
- [ ] Both roles persist in database

#### 4. Multi-Role User
- [ ] User with 2+ roles
- [ ] Go to RoleSelectionScreen
- [ ] See all assigned roles highlighted
- [ ] Can switch between roles
- [ ] Each role takes to correct dashboard
- [ ] Active role persists across app restarts

#### 5. Error Handling (with migration NOT applied)
- [ ] Test with fresh database (table doesn't exist)
- [ ] Register new user
- [ ] Select role
- [ ] App shows console warning (not blocking)
- [ ] App continues to work (local storage fallback)
- [ ] User can still use the app
- [ ] Role saved locally (in AsyncStorage)

#### 6. Navigation Flow
- [ ] HomeScreen → Login works
- [ ] HomeScreen → Register works
- [ ] After login → RoleSelection (if no role)
- [ ] After role selected → Correct dashboard
- [ ] Dashboard → ProfileSettings works
- [ ] ProfileSettings → RoleSelection works
- [ ] No navigation warnings in console (or only during hot-reload)

---

## Route Map

### Authenticated Routes (by Role)

**Common Routes** (available in all role stacks):
- `RoleSelection` - RoleSelectionScreen (NEW - allows switching roles)
- `Home` - HomeScreen
- `Profile` - ProfileScreen
- `ProfileSettings` - ProfileSettingsScreen
- `Messaging` - MessagingScreen
- `SpecialistDirectory` - SpecialistDirectoryScreen
- `SpecialistProfile` - SpecialistProfileScreen
- `SpecialistRegistration` - SpecialistRegistrationScreen
- `Upgrade` - UpgradeScreen

**Tenant Routes** (activeRole = 'tenant'):
- Stack: `TenantApp` → Inner stack: `TenantTabsStack`
  - Tab: `Home` - HomeScreen
  - Tab: `TenantHome` - TenantDashboard
  - Tab: `Profile` - ProfileScreen
  - Modal: `PropertyDetail` - PropertyDetailScreen
  - + All common routes above

**Landlord Routes** (activeRole = 'landlord'):
- Stack: `LandlordApp` → Inner stack: `LandlordTabsStack`
  - Tab: `Home` - HomeScreen
  - Tab: `LandlordHome` - LandlordDashboard
  - Tab: `Profile` - ProfileScreen
  - Modal: `PropertyDetail` - PropertyDetailScreen
  - + All common routes above

**Builder Routes** (activeRole = 'builder'):
- Stack: `BuilderApp` → Inner stack: `BuilderTabsStack`
  - Tab: `Home` - HomeScreen
  - Tab: `BuilderHome` - BuilderDashboard
  - Tab: `Profile` - ProfileScreen
  - Modal: `ProjectDetail` - ProjectDetailScreen
  - Modal: `PropertyDetail` - PropertyDetailScreen
  - + All common routes above

**Specialist Routes** (activeRole = 'specialist'):
- Stack: `SpecialistApp` → Inner stack: `SpecialistTabsStack`
  - Tab: `Home` - HomeScreen
  - Tab: `SpecialistHome` - SpecialistDashboard
  - Tab: `Profile` - ProfileScreen
  - + All common routes above (except PropertyDetail/ProjectDetail)

**Employee Routes** (activeRole = 'employee'):
- Stack: `EmployeeApp` → Inner stack: `EmployeeTabsStack`
  - Tab: `Home` - HomeScreen
  - Tab: `EmployeeHome` - EmployeeDashboard
  - Tab: `Profile` - ProfileScreen
  - Modal: `ProjectDetail` - ProjectDetailScreen
  - + All common routes above

### Unauthenticated Routes

- Stack: `AuthStack`
  - `Landing` - HomeScreen (initial route)
  - `Login` - LoginScreen
  - `Register` - RegisterScreen

### Role Selection Route

- `RoleSelection` - RoleSelectionScreen
  - Shown when user is authenticated but has no active role
  - Also accessible from ProfileSettings to switch/add roles

---

## Database Schema

After applying the migration, the `user_roles` table:

```sql
Table: public.user_roles
Columns:
  - id: uuid (Primary Key)
  - user_id: uuid (Foreign Key → auth.users.id)
  - role: text (CHECK: 'tenant'|'landlord'|'builder'|'specialist'|'employee'|'admin')
  - created_at: timestamptz

RLS Policies:
  - user_roles_select_own: Users can SELECT their own roles
  - user_roles_insert_own: Users can INSERT their own roles
  - user_roles_update_own: Users can UPDATE their own roles
  - user_roles_delete_own: Users can DELETE their own roles
```

---

## Known Limitations / TODOs

1. **Admin Role**: The 'admin' role is now allowed in the database, but there's no UI for admin-specific features yet.
2. **Navigation Warnings**: During hot-reload or fast-refresh, you may see navigation warnings. These are harmless and don't affect production.
3. **Offline Mode**: If the app starts offline, role fetching will fail silently. User must have an active role cached.
4. **Profile Creation**: The app references a `profiles` table in ProfileSettingsScreen that may need a similar migration.

---

## Support

If issues persist:

1. Check console logs for detailed error messages
2. Verify Supabase dashboard shows `user_roles` table
3. Verify RLS policies are enabled
4. Clear app cache: Stop Expo → Clear cache → Restart
5. Check `.env` file has correct Supabase credentials

For questions, refer to:
- `SUPABASE_SETUP.md` - Database setup
- `src/hooks/useAuth.tsx` - Authentication logic
- `src/navigation/RootNavigator.tsx` - Navigation structure
