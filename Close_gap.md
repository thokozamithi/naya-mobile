# Naya – Property Management Platform
Product Completion & End-State Vision

## Mission
Naya is a modern property management system that allows landlords, tenants, employees, and service providers to manage rentals, leases, maintenance, communication, and payments in one platform.

The app is already running and stable.

The goal is NOT to rebuild.
The goal is to CLOSE PRODUCT GAPS and make unfinished pages production-ready.

---

## Current Situation
- Navigation works.
- Authentication works.
- UI framework exists.
- Many pages are partially implemented or placeholders.
- Some lists use mock data.
- Some buttons have no actions.
- Some screens lack loading / empty / error states.

We need the system to feel COMPLETE and TRUSTWORTHY.

---

## What "DONE" Means
A page is considered complete when it has:

- Real or clearly defined data source
- Loading state
- Empty state
- Error handling
- Validation for forms
- Success / failure user feedback
- Proper navigation behavior
- Role permissions respected
- No dead buttons
- No console.log debugging
- No mock arrays unless marked MVP_TEMP

---

## Core Roles
1. Landlord
2. Tenant
3. Employee / Manager
4. Specialist / Vendor (phase 2 depth)

---

## Core System Objects
These power the entire platform:

- Properties
- Units
- Tenants
- Leases
- Work Orders (maintenance)
- Payments
- Employees
- Messages / Conversations
- Documents

If something is missing, propose the MINIMUM schema to support UI.

---

## Landlord Experience (Primary Priority)

Landlord should be able to:

✅ Create and manage properties  
✅ Add units  
✅ Assign tenants  
✅ Track leases  
✅ Collect & record rent  
✅ View overdue payments  
✅ Manage maintenance lifecycle  
✅ Assign work  
✅ Message tenants or staff  
✅ See high-level performance  

If these work, the product feels real.

---

## Tenant Experience (Secondary)

Tenant should be able to:

✅ View lease  
✅ Pay rent  
✅ Submit maintenance request  
✅ Track request progress  
✅ Message landlord  
✅ Access documents  

---

## UX Expectations
Use existing design system.
Be consistent.
Prefer simple, reliable flows over fancy UI.

---

## Technical Philosophy
- Minimal invasive edits
- Follow current architecture
- Reuse components/hooks
- Avoid rewriting navigation
- Build small, testable increments

---

## Priorities
P0 → Properties, Maintenance, Tenants, Payments  
P1 → Messages, Employees, Reports  
P2 → Salaries, Specialist marketplace, advanced analytics  

---

## Definition of Success
When a landlord can:

Add a property → add a unit → assign a tenant → create lease → request maintenance → assign worker → record payment → send message

WITHOUT developer intervention.

---

## Your Role (Claude)
You are a senior engineer finishing a funded startup product before launch.

You identify:
- unfinished flows
- missing connections
- fake data
- broken UX expectations

And you turn them into working software.

Small steps.
High confidence.
Shippable results.
