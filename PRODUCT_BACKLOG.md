# Naya Product Backlog - Prioritized Gap Analysis

**Generated**: 2026-02-13
**Status**: Pre-Implementation

---

## Executive Summary

**Total Gaps Identified**: 37
- **P0 (Critical)**: 15 items
- **P1 (Important)**: 13 items
- **P2 (Nice-to-have)**: 9 items

**Current State**:
- ✅ Auth & navigation working
- ✅ Role system functional
- ✅ Basic UI framework established
- ❌ Most features show "coming soon" alerts
- ❌ Tabs don't switch content
- ❌ No database tables except user_roles
- ❌ Critical user flows broken

---

## P0 - CRITICAL (Ship Blocker)

These must work for the product to be usable.

### DATABASE FOUNDATION
**Batch 0: Core Schema**
- [ ] P0.1 - Create `properties` table + RLS policies
- [ ] P0.2 - Create `units` table + RLS policies
- [ ] P0.3 - Create `maintenance_requests` table + RLS policies
- [ ] P0.4 - Create `tenants` table + RLS policies
- [ ] P0.5 - Create `leases` table + RLS policies

### LANDLORD EXPERIENCE (Primary User)
**Batch 1: Property Management**
- [ ] P0.6 - Implement "Add Property" flow (form + validation + Supabase insert)
- [ ] P0.7 - Implement "Edit Property" (load data, update, success feedback)
- [ ] P0.8 - Implement "Add Unit" to property (form + insert)
- [ ] P0.9 - Make LandlordDashboard tabs functional (Overview, Properties, Tenants, etc.)
- [ ] P0.10 - Create Properties list/grid view with filters

**Batch 2: Maintenance Management**
- [ ] P0.11 - Implement "Request Maintenance" from PropertyDetail (landlord-initiated)
- [ ] P0.12 - Create Maintenance tab view in LandlordDashboard
- [ ] P0.13 - Add maintenance request status update (pending → in_progress → completed)
- [ ] P0.14 - Add maintenance request assignment to employee

### TENANT EXPERIENCE
**Batch 3: Tenant Core Flows**
- [ ] P0.15 - Implement "Report Issue" / maintenance request submission
- [ ] P0.16 - Implement "Join Property" flow (enter code, link to property)
- [ ] P0.17 - Make TenantDashboard tabs functional
- [ ] P0.18 - Show tenant's property/unit details
- [ ] P0.19 - Tenant view their lease details

---

## P1 - IMPORTANT (Launch Enhancers)

Required for feeling complete, but product works without them temporarily.

### PAYMENTS
**Batch 4: Payment Infrastructure**
- [ ] P1.1 - Create `payments` table + RLS
- [ ] P1.2 - Implement "Pay Rent" button → payment form
- [ ] P1.3 - Record payment (manual for MVP, log transaction)
- [ ] P1.4 - Landlord view payment history
- [ ] P1.5 - Payment status indicators (paid, overdue, pending)

### EMPLOYEE/BUILDER
**Batch 5: Work Management**
- [ ] P1.6 - Create `employees` table + RLS
- [ ] P1.7 - Create `projects` table (already typed, needs migration)
- [ ] P1.8 - Implement "New Project" for builder
- [ ] P1.9 - Implement "Edit Project" + "Update Progress"
- [ ] P1.10 - Project detail enhancements (timeline, photos)

### MESSAGING
**Batch 6: Communication**
- [ ] P1.11 - Create `messages` table (already hooked, needs migration)
- [ ] P1.12 - Enhance MessagingScreen with user profiles
- [ ] P1.13 - Add "Start Conversation" flow from specialist/tenant
- [ ] P1.14 - Notification badges for unread messages

---

## P2 - NICE-TO-HAVE (Post-Launch)

Deepen value but not launch blockers.

### SPECIALIST MARKETPLACE
**Batch 7: Specialist Features**
- [ ] P2.1 - Create `specialists` table (already typed, needs migration)
- [ ] P2.2 - Implement "Hire Specialist" flow (contract, rate agreement)
- [ ] P2.3 - Specialist search and filters work
- [ ] P2.4 - Rating/review system for specialists

### ADMIN & ANALYTICS
**Batch 8: Platform Management**
- [ ] P2.5 - Admin dashboard: view all landlords/users
- [ ] P2.6 - Membership management (upgrade/downgrade users)
- [ ] P2.7 - Analytics dashboard (revenue, active users, properties)
- [ ] P2.8 - Salaries management for employees

### UX POLISH
**Batch 9: Final Touches**
- [ ] P2.9 - HomeScreen "Take a Tour" → real onboarding flow
- [ ] P2.10 - Image upload for properties/projects
- [ ] P2.11 - Document upload for leases
- [ ] P2.12 - Advanced filters and search across all entities

---

## Technical Debt & Cleanup

**Throughout all batches**:
- Remove all `Alert.alert('coming soon')` placeholders
- Remove all console.log statements (except errors)
- Add loading/empty/error states where missing
- Ensure all forms have validation
- Ensure all mutations have success/failure feedback
- Test role permissions on every feature

---

## Definition of Done (Per-Item)

Each backlog item is "done" when:
- ✅ Database table/columns created (if needed)
- ✅ RLS policies tested
- ✅ UI form/page implemented
- ✅ Data fetching with loading state
- ✅ Empty state handled
- ✅ Error handling with user feedback
- ✅ Success confirmation
- ✅ Form validation (if applicable)
- ✅ Role permissions enforced
- ✅ Manual test passed
- ✅ No dead buttons remain

---

## Batching Strategy

**P0 Batch 0** (DB Foundation): ~30 min
**P0 Batch 1** (Landlord Properties): ~2 hours
**P0 Batch 2** (Maintenance): ~1.5 hours
**P0 Batch 3** (Tenant Core): ~1.5 hours

Total P0: ~5.5 hours to minimum viable product

**P1 Batches 4-6**: ~4 hours
**P2 Batches 7-9**: ~3 hours

Total time to complete product: ~12-13 hours

---

## Next Step

**START WITH**: P0 Batch 0 - Database Foundation
Create the 5 core tables that unlock all other features.
