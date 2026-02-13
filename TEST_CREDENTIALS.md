# Test Credentials & Setup Guide

## Quick Testing Setup

### Option 1: Create Test Accounts via the App

1. **Start the app** with `npm start` from the Naya mobile directory
2. **Press `w`** to open on web or scan QR with Expo Go
3. **Click "Create Account"** on the login screen
4. Fill in the form:
   - Email: `test-tenant@naya.local`
   - Password: `TestPassword123!`
   - Full Name: `Test Tenant`
5. **Select a role** (Tenant, Landlord, Builder, Specialist, or Employee)
6. Done! You can now test the app

### Option 2: Use These Pre-Made Test Accounts

If you've already created these accounts in your Supabase database, use these credentials:

#### Tenant Account
- **Email:** `tenant@naya.local`
- **Password:** `TenantPass123!`
- **Role:** Tenant
- **Full Name:** John Tenant

#### Landlord Account
- **Email:** `landlord@naya.local`
- **Password:** `LandlordPass123!`
- **Role:** Landlord
- **Full Name:** landlord Smith

#### Builder Account
- **Email:** `builder@naya.local`
- **Password:** `BuilderPass123!`
- **Role:** Builder
- **Full Name:** Bob Builder

#### Specialist Account
- **Email:** `specialist@naya.local`
- **Password:** `SpecialistPass123!`
- **Role:** Specialist
- **Full Name:** Sarah Specialist

#### Employee Account
- **Email:** `employee@naya.local`
- **Password:** `EmployeePass123!`
- **Role:** Employee
- **Full Name:** Emily Employee

---

## To Create These Test Accounts in Supabase

### Method 1: Via Supabase Dashboard (Easiest)

1. Go to https://app.supabase.com
2. Open your Naya project
3. Go to **Authentication > Users**
4. Click **"Create new user"** for each test account above
5. Fill in:
   - Email (use emails from above)
   - Password (use passwords from above)
   - Email confirmed: ✓ Check this box
6. Click **"Create user"**

### Method 2: Via SQL Query

Run this SQL in your Supabase SQL Editor to insert test data:

```sql
-- Note: Replace project-name with your actual project
-- This assumes you have a user_profiles table

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('user-tenant-123', 'tenant@naya.local', crypt('TenantPass123!', gen_salt('bf')), now(), now(), now()),
  ('user-landlord-456', 'landlord@naya.local', crypt('LandlordPass123!', gen_salt('bf')), now(), now(), now()),
  ('user-builder-789', 'builder@naya.local', crypt('BuilderPass123!', gen_salt('bf')), now(), now(), now()),
  ('user-specialist-012', 'specialist@naya.local', crypt('SpecialistPass123!', gen_salt('bf')), now(), now(), now()),
  ('user-employee-345', 'employee@naya.local', crypt('EmployeePass123!', gen_salt('bf')), now(), now(), now());

-- Add user roles
INSERT INTO user_roles (user_id, role)
VALUES
  ('user-tenant-123', 'tenant'),
  ('user-landlord-456', 'landlord'),
  ('user-builder-789', 'builder'),
  ('user-specialist-012', 'specialist'),
  ('user-employee-345', 'employee');
```

---

## Testing the App

### 1. **Home Screen**
   - Log in with any test account
   - See the personalized home screen for your role
   - Quick access buttons are visible

### 2. **Navigation**
   - Click any quick access button to navigate
   - Back button returns to home

### 3. **Role-Specific Features**

#### Tenant Testing
- ✅ View properties
- ✅ Browse specialists
- ✅ Message landlords/specialists
- ✅ Edit profile

#### Landlord Testing
- ✅ Manage properties
- ✅ Message tenants
- ✅ Hire specialists
- ✅ View subscriptions

#### Builder Testing
- ✅ Track projects
- ✅ Manage teams
- ✅ Message team members
- ✅ Hire specialists

#### Specialist Testing
- ✅ View job requests
- ✅ Message clients
- ✅ Manage availability
- ✅ Track ratings

#### Employee Testing
- ✅ View assigned tasks
- ✅ Update project status
- ✅ Message supervisors
- ✅ Manage availability

---

## Environment Setup

Make sure your `.env.local` has correct Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from:
1. https://app.supabase.com
2. Select your project
3. **Settings > API**
4. Copy `Project URL` and `Public API Key`

---

## Common Issues

### "Invalid login credentials"
- Check that email/password are correct
- Ensure the account exists in Supabase
- Try creating a new account instead

### "Role not found"
- After login, you'll see role selection if no role is set
- Select your desired role from the list

### "Can't connect to Supabase"
- Verify `.env.local` is in the project root
- Check Supabase credentials are correct
- Ensure project is active on supabase.com

---

## Resetting Test Data

To clear and start fresh:

1. Go to https://app.supabase.com
2. Open your project
3. Go to **SQL Editor**
4. Run: `DELETE FROM auth.users WHERE email LIKE '%@naya.local';`
5. Recreate accounts following "Method 1" or "Method 2" above

---

## Next Steps

After testing works:
1. Try logging in with different test accounts
2. Switch roles from profile settings
3. Test messaging between accounts
4. Browse specialist directory
5. Test property/project management screens

Happy testing! 🎉
