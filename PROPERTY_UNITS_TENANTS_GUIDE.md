# Property → Units → Tenants System Guide

**Date**: 2026-02-13
**Purpose**: Complete guide to managing multi-unit properties and tenant assignments

---

## 📊 Data Model Overview

```
Property (e.g., "Sunset Apartments")
  ├─ property_code: "SUN-1234"
  ├─ total_units: 10
  │
  ├─ Unit 101
  │   ├─ unit_code: "101"
  │   ├─ status: "occupied"
  │   ├─ monthly_rent: $1200
  │   └─ Tenant: John Doe (user_id: abc-123)
  │
  ├─ Unit 102
  │   ├─ unit_code: "102"
  │   ├─ status: "vacant"
  │   └─ monthly_rent: $1300
  │
  ├─ Unit 103
  │   ├─ unit_code: "103"
  │   ├─ status: "maintenance"
  │   └─ monthly_rent: $1200
  │
  └─ Unit 201
      ├─ unit_code: "201"
      ├─ status: "occupied"
      ├─ monthly_rent: $1500
      └─ Tenant: Jane Smith (user_id: xyz-789)
```

---

## 🗄️ Database Schema

### 1. Properties Table
```sql
create table public.properties (
  id uuid primary key,
  user_id uuid not null,  -- Landlord/owner
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  property_type text not null,
  total_units integer not null default 1,
  description text,
  photos text[],
  property_code text unique,  -- e.g., "SUN-1234"
  created_at timestamptz,
  updated_at timestamptz
);
```

### 2. Units Table
```sql
create table public.units (
  id uuid primary key,
  property_id uuid references properties(id),  -- Links to property
  unit_name text not null,       -- "Apartment 101"
  unit_code text not null,       -- "101"
  status text not null,          -- 'vacant', 'occupied', 'maintenance', 'unavailable'
  bedrooms integer,
  bathrooms numeric(2,1),
  square_feet integer,
  monthly_rent numeric(10,2),
  created_at timestamptz,
  updated_at timestamptz
);
```

### 3. Tenants Table
```sql
create table public.tenants (
  id uuid primary key,
  user_id uuid references auth.users(id),     -- Tenant user account
  property_id uuid references properties(id), -- Which property
  unit_id uuid references units(id),          -- Which specific unit (can be NULL)
  full_name text not null,
  email text not null,
  phone text,
  move_in_date date,
  move_out_date date,
  status text default 'active',
  notes text,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Key Relationship**:
- `tenants.unit_id` links tenant to specific unit
- Multiple properties can each have multiple units
- Each unit can have ONE active tenant
- Each tenant can be assigned to ONE unit

---

## 🔄 Complete Workflow

### Workflow 1: Landlord Creates Property with Units

**Step 1: Create Property**
```
1. Landlord taps "Add Property"
2. Fills in:
   - Name: "Sunset Apartments"
   - Address: "123 Main St"
   - City: "Los Angeles"
   - Total Units: 10
3. Taps "Add Property"
4. Property created with auto-generated code "SUN-1234"
```

**Step 2: Add Units to Property**
```
1. Landlord opens Property Detail Screen
2. Taps "Manage Units" button
3. Sees UnitsManagementScreen (currently 0 units)
4. Taps "+ Add Unit"
5. Fills in AddUnitScreen:
   - Unit Name: "Apartment 101"
   - Unit Code: "101"
   - Status: "Vacant"
   - Bedrooms: 2
   - Bathrooms: 1
   - Square Feet: 850
   - Monthly Rent: $1200
6. Taps "Add Unit"
7. Unit created and linked to property
8. Repeats for other units (102, 103, 201, etc.)
```

**Step 3: Share Property Code with Tenants**
```
1. Landlord opens Property Detail
2. Sees property code card: "SUN-1234"
3. Taps "📱 Show QR Code"
4. Shows QR code to tenant OR emails screenshot
```

---

### Workflow 2: Tenant Joins Property

**Option A: Scan QR Code**
```
1. Tenant opens app (logged in)
2. Tenant role → "Join Property" button visible
3. Taps "Join Property"
4. Taps "📷 Scan" button
5. Scans landlord's QR code
6. Property code auto-fills: "SUN-1234"
7. (Optional) Enters unit code: "101"
8. Taps "Join Property"
9. Success! Tenant joined
```

**Option B: Manual Entry**
```
1. Landlord texts tenant: "Property code: SUN-1234, Unit: 101"
2. Tenant opens app → "Join Property"
3. Enters property code: "SUN-1234"
4. Enters unit code: "101"
5. Taps "Join Property"
6. Success! Tenant joined
```

**What Happens in Database**:
```sql
-- When tenant joins with unit code "101":
insert into tenants (
  user_id,        -- Tenant's user ID
  property_id,    -- Looked up from property_code "SUN-1234"
  unit_id,        -- Looked up from unit_code "101" in that property
  full_name,
  email,
  status
) values (...);

-- Unit status automatically updated:
update units
set status = 'occupied'
where id = <unit_id>;
```

---

### Workflow 3: Tenant Without Unit (Property-Level Only)

Some properties don't use units (single-family homes):

```
1. Landlord creates property:
   - Name: "123 Oak Street House"
   - Total Units: 1
   - Does NOT create units
2. Tenant joins with property code only
3. Database:
   tenants.property_id = <property_id>
   tenants.unit_id = NULL
4. Tenant can still:
   - Submit maintenance requests
   - Make payments
   - View lease
```

---

## 🏗️ UI Screens Overview

### For Landlords

**1. PropertyDetailScreen**
- Shows property info, property code, QR code button
- **NEW**: "Manage Units" button → UnitsManagementScreen

**2. UnitsManagementScreen** ✅ (Created)
- Lists all units in property
- Shows summary: 3 Vacant, 7 Occupied, 0 Maintenance
- Tap "+ Add Unit" → AddUnitScreen
- Tap on unit card → EditUnitScreen (to be created)

**3. AddUnitScreen** ✅ (Already exists)
- Form to add new unit
- Fields: Name, Code, Status, Bedrooms, Bathrooms, Sq Ft, Rent
- Creates unit linked to property

**4. EditUnitScreen** (To be created)
- Edit unit details
- Change status (vacant → occupied when tenant joins)
- View which tenant is in this unit

**5. AssignTenantToUnitScreen** (To be created)
- List of tenants who joined property but no unit assigned
- Tap tenant → Select unit → Assign
- Updates tenants.unit_id

### For Tenants

**1. JoinPropertyScreen** ✅ (Already functional)
- Property code input (required)
- Unit code input (optional)
- QR code scanner
- If unit code provided, tenant assigned to that unit
- If not, tenant assigned to property only

**2. TenantHomeScreen**
- Shows property name
- Shows unit name (if assigned): "Your Unit: Apartment 101"
- Maintenance requests can specify unit
- Payments linked to unit rent

---

## 🔧 Implementation Status

### ✅ Completed
1. Database schema (properties, units, tenants tables)
2. RLS policies for data isolation
3. Property code generation with triggers
4. QR code generation & scanning
5. `useUnits(propertyId)` hook added to useData.ts
6. UnitsManagementScreen created
7. AddUnitScreen created
8. JoinPropertyScreen supports optional unit_code

### 🚧 To Implement
1. Add "Manage Units" button to PropertyDetailScreen
2. Create EditUnitScreen
3. Create AssignTenantToUnitScreen
4. Update TenantHomeScreen to show unit assignment
5. Maintenance requests: allow selecting unit
6. Payments: link to unit rent

---

## 📝 Code Examples

### 1. Fetch Units for Property

```typescript
import { useUnits } from '@/hooks/useData';

function MyComponent({ propertyId }) {
  const { data: units, isLoading } = useUnits(propertyId);

  return (
    <View>
      {units.map(unit => (
        <Text key={unit.id}>
          {unit.unit_name} - {unit.status}
        </Text>
      ))}
    </View>
  );
}
```

### 2. Tenant Joins Property with Unit

```typescript
// In JoinPropertyScreen.tsx (already implemented):

// Look up property by property_code
const { data: property } = await supabase
  .from('properties')
  .select('id')
  .eq('property_code', 'SUN-1234')
  .single();

// Look up unit by unit_code (if provided)
let unitId = null;
if (unitCode) {
  const { data: unit } = await supabase
    .from('units')
    .select('id')
    .eq('property_id', property.id)
    .eq('unit_code', unitCode)
    .single();
  unitId = unit.id;
}

// Create tenant record
await supabase
  .from('tenants')
  .insert({
    user_id: currentUser.id,
    property_id: property.id,
    unit_id: unitId,  // NULL if no unit code provided
    full_name: currentUser.full_name,
    email: currentUser.email,
    status: 'active',
  });
```

### 3. Query Tenants by Unit

```typescript
// Get tenant assigned to specific unit
const { data: tenant } = await supabase
  .from('tenants')
  .select('*, users:user_id(full_name, email)')
  .eq('unit_id', unitId)
  .eq('status', 'active')
  .single();

// Result:
{
  id: "...",
  user_id: "abc-123",
  property_id: "...",
  unit_id: "...",
  full_name: "John Doe",
  email: "john@example.com",
  users: {
    full_name: "John Doe",
    email: "john@example.com"
  }
}
```

---

## 🎯 Next Steps to Complete System

### Step 1: Update PropertyDetailScreen

Add "Manage Units" button that navigates to UnitsManagementScreen:

```typescript
// In PropertyDetailScreen.tsx
<TouchableOpacity
  style={styles.manageUnitsButton}
  onPress={() =>
    navigation.navigate('UnitsManagement', {
      propertyId: property.id,
      propertyName: property.name,
    })
  }
>
  <Text style={styles.manageUnitsButtonText}>
    🏢 Manage Units ({units?.length || 0})
  </Text>
</TouchableOpacity>
```

### Step 2: Register Routes

Update RootNavigator.tsx to include new screens:

```typescript
<Stack.Screen name="UnitsManagement" component={UnitsManagementScreen} />
<Stack.Screen name="AddUnit" component={AddUnitScreen} />
<Stack.Screen name="EditUnit" component={EditUnitScreen} />
```

### Step 3: Test Complete Workflow

1. Create property "Sunset Apartments"
2. Add 5 units (101, 102, 103, 201, 202)
3. Set Unit 101 as "Vacant"
4. Show QR code
5. As tenant, scan QR code
6. Enter unit code "101"
7. Join property
8. Verify:
   - Tenant record created with unit_id
   - Unit 101 status changed to "Occupied"
   - Tenant sees "Your Unit: Apartment 101"

---

## 🔍 Querying Examples

### Get All Vacant Units for a Property
```sql
select * from units
where property_id = '<property_id>'
and status = 'vacant'
order by unit_name;
```

### Get All Tenants in a Property
```sql
select
  t.*,
  u.unit_name,
  u.unit_code,
  u.monthly_rent
from tenants t
left join units u on u.id = t.unit_id
where t.property_id = '<property_id>'
and t.status = 'active'
order by u.unit_name;
```

### Get Occupancy Rate
```sql
select
  count(*) filter (where status = 'occupied') as occupied_units,
  count(*) filter (where status = 'vacant') as vacant_units,
  count(*) as total_units,
  round(
    100.0 * count(*) filter (where status = 'occupied') / count(*),
    1
  ) as occupancy_rate
from units
where property_id = '<property_id>';
```

---

## 📱 User Experience

### Landlord Experience
1. **Create property** → Auto-generates code
2. **Add units** → Quick form for each unit
3. **Share code** → QR or text to tenants
4. **View occupancy** → Dashboard shows 7/10 occupied
5. **Manage tenants** → See who's in each unit

### Tenant Experience
1. **Scan QR** → Instant property code fill
2. **Enter unit** → Optional but recommended
3. **Join** → One tap
4. **Home screen** → Shows "Your Unit: Apt 101"
5. **Maintenance** → Pre-filled with unit info
6. **Payments** → Rent amount from unit.monthly_rent

---

## 🎨 UI/UX Considerations

### Unit Status Colors
- **Vacant** (Green #34C759): Available for new tenant
- **Occupied** (Blue #007AFF): Currently has tenant
- **Maintenance** (Orange #FF9500): Under repair, temporarily unavailable
- **Unavailable** (Gray #8E8E93): Off-market or not rentable

### Empty States
- **No units yet**: Friendly message with "Add First Unit" button
- **No tenants**: "Share your property code to get tenants"
- **All vacant**: Celebrate with encouragement message

### Visual Hierarchy
```
UnitsManagementScreen
├─ Summary Cards (Vacant, Occupied, Maintenance)
├─ Units List
│  ├─ Unit Card (101)
│  │  ├─ Name & Code
│  │  ├─ Status Badge
│  │  ├─ Details (beds, baths, sqft)
│  │  └─ Rent Amount
│  └─ ...
└─ Floating "+ Add Unit" Button
```

---

## 🔐 Security & Permissions

### RLS Policies

**Units**: Landlords can only see/edit units for their own properties
```sql
create policy "units_select_via_property"
  on units for select
  using (
    exists (
      select 1 from properties
      where properties.id = units.property_id
      and properties.user_id = auth.uid()
    )
  );
```

**Tenants**: Can only see their own tenant record
```sql
create policy "tenants_select_own"
  on tenants for select
  using (auth.uid() = user_id);
```

---

## 📊 Analytics Opportunities

### Property Dashboard
- Occupancy rate: 7/10 units occupied (70%)
- Total monthly revenue: $8,400 (sum of occupied units' rent)
- Average rent: $1,200
- Vacant units: 3 (30% vacancy rate)
- Units in maintenance: 0

### Unit Performance
- Days vacant: Track how long each unit sits empty
- Rent per sq ft: Compare units
- Turnover rate: How often tenants move out

---

## ✅ Summary

**Current System**:
- ✅ Properties can have multiple units
- ✅ Units have detailed info (beds, baths, sqft, rent)
- ✅ Tenants join property with optional unit code
- ✅ Database tracks property → unit → tenant relationship
- ✅ UI screens created (UnitsManagement, AddUnit)

**To Complete**:
- Add "Manage Units" button to PropertyDetailScreen
- Register routes in RootNavigator
- Create EditUnitScreen
- Show unit assignment on TenantHomeScreen
- Link maintenance requests to units
- Link payments to unit rent

**Result**: Full multi-unit property management system where landlords can manage individual apartments/units and tenants are assigned to specific units with all data properly tracked.

---

**Questions?**
- Units are optional (single-family homes don't need them)
- Unit codes must be unique within a property
- Tenants can join without unit code (property-level only)
- Landlords can reassign tenants to different units
- Unit status automatically updates when tenant joins/leaves

---

**Files Created**:
- ✅ src/screens/property/UnitsManagementScreen.tsx
- ✅ src/screens/property/AddUnitScreen.tsx (already existed)
- ✅ src/hooks/useData.ts (added useUnits hook)

**Next File to Create**:
- src/screens/property/EditUnitScreen.tsx
