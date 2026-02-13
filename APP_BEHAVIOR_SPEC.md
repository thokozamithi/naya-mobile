# Naya Central — App Behavior Spec

## A. Site Map

| Route | Page | Purpose | Key Sections |
|---|---|---|---|
| `/` | Home (Index) | Marketing landing page | Hero, Stats, Features, BuildersConnection, Testimonials, CTA, Footer. Floating "Take a Tour" button (driver.js). |
| `/auth` | Auth | Sign In / Sign Up / Forgot Password | Toggle between signin & signup modes. Supports `?invite=TOKEN` for invitation flow. Forgot-password sends email link. |
| `/reset-password` | Reset Password | Set new password after email link | Validates recovery code/token from URL, shows password form or "invalid link" state. |
| `/roles` | Role Dashboard | Role selection hub (post-login home) | Cards for Tenant, Landlord, Employee, Builder, Specialist. Admin card visible only to admins. "Create Role" or "Switch to Role" per card. |
| `/tenant` | Tenant Dashboard | Tenant portal | Tabs: Overview, Payments, Maintenance, Messages, Lease, Settings, Help. Mobile bottom nav. Quick Actions. Pay Rent dialog. Join Property dialog. |
| `/landlord` | Landlord Dashboard | Landlord portal | Tabs: Overview, Properties, Tenants, Employees, Salaries, Payments, Maintenance, Specialists, Messages, Reports. KPI cards. Mobile side-sheet menu. |
| `/landlord/property/:propertyId` | Property Detail | Single property management | Tabs: Overview (w/ KPIs), Units, Tenants, Employees, Maintenance, Performance, Financials. Back → landlord properties tab. |
| `/employee` | Employee Dashboard | Employee portal | Tabs: Overview, My Profile, Properties, Work Orders, Work History, Salary. Wrapped in `PasswordChangeGate`. Mobile side-sheet menu. |
| `/builder` | Builder Dashboard | Builder portal | Stats cards (projects, budget, spent). Project list. Create Project dialog. My Job Postings & Jobs. |
| `/builder/project/:projectId` | Project Detail | Single construction project | Budget cards, utilization bar. Tabs: Expenses, Materials, Analytics. Add Expense/Material dialogs. |
| `/specialist` | Specialist Dashboard | Specialist portal | Stats (rating, reviews, jobs). Profile completion bar. Tabs: Overview, Earnings, Portfolio, Messages, Reviews, Jobs, Schedule. |
| `/specialists` | Specialist Directory | Browse/search specialists | Search + category/availability filters. Card grid linking to profiles. **Pro-only** for builders & landlords. |
| `/specialist/register` | Specialist Registration | Create/edit specialist profile | Tabs: Profile, Skills, Certifications, Availability. Back → `/specialists`. |
| `/specialist/:specialistId` | Specialist Profile | Public specialist profile | Profile header, contact info, Tabs: Portfolio, Reviews, Skills & Certs, Availability. Hire & Message actions. |
| `/profile` | Profile Settings | User account settings | Avatar upload, name/phone edit, password change, 2FA, role management, membership status, activity log, delete account. |
| `/upgrade` | Upgrade | Pro subscription purchase | Plan selection (monthly/yearly), payment method, reference input. Back → `navigate(-1)`. |
| `/admin` | Admin Dashboard | System administration | Stats, Tabs: Pending Approvals, All Subscriptions, Memberships, Analytics. Server-side admin check. |
| `*` | 404 Not Found | Catch-all | "Return to Home" link → `/`. |

---

## B. Navigation Rules

### Auth Guards (Login Required)

| Route | Guard Logic |
|---|---|
| `/roles` | Redirects to `/auth` if no user |
| `/tenant` | Redirects to `/auth` if no user; redirects to `/roles` if role ≠ tenant & ≠ admin |
| `/landlord` | Redirects to `/auth` if no user; redirects to `/roles` if role ≠ landlord & ≠ admin |
| `/employee` | Redirects to `/auth` if no user; redirects to `/roles` if role ≠ employee & ≠ admin |
| `/builder` | Redirects to `/auth` if no user; redirects to `/` if role ≠ builder & ≠ landlord & ≠ admin |
| `/specialist` | Shows "Sign In" CTA if no user; shows "Create Profile" CTA if no specialist record |
| `/specialists` | Shows locked screen if not Pro; shows "Access Restricted" if role ≠ builder & ≠ landlord |
| `/specialist/register` | Shows "Sign In" CTA if no user |
| `/profile` | Redirects to `/auth` if no user |
| `/admin` | Redirects to `/auth` if no user; redirects to `/` if not server-verified admin |
| `/upgrade` | Redirects to `/auth` on upgrade click if no user |

### Default Route After Login

- **Sign In** → `/roles`
- **Sign Up** → `/roles`
- **Invitation Sign Up** → consumes invitation → `/roles`
- **Already logged in + visit `/auth`** → redirected to `/roles`

### Back Button Behavior

| Page | "Back" Destination | Method |
|---|---|---|
| `/auth` | `/` (Home) | `navigate("/")` — push |
| `/roles` | No back button | — |
| `/tenant` | No back button (has DashboardHeader logo → `/`) | — |
| `/landlord` | No back button (has DashboardHeader logo → `/`) | — |
| `/landlord/property/:id` | `/landlord` with `activeTab: "properties"` | `navigate("/landlord", { state })` — push |
| `/employee` | No back button (has DashboardHeader logo → `/`) | — |
| `/builder` | No back button (has DashboardHeader logo → `/`) | — |
| `/builder/project/:id` | `/builder` | `navigate("/builder")` — push |
| `/specialist` | No back button (has Header with nav links) | — |
| `/specialists` | No back button (has Header with nav links) | — |
| `/specialist/register` | `/specialists` | `navigate("/specialists")` — push |
| `/specialist/:id` | `/specialists` | `navigate("/specialists")` — push |
| `/profile` | Role-based dashboard | `navigate(getDashboardPath(activeRole))` — push |
| `/upgrade` | Previous page | `navigate(-1)` — browser back |
| `/admin` | `/` (Home) | `navigate("/")` — push |
| `/reset-password` | `/auth` (on success or invalid link) | `navigate("/auth")` — push |
| `404` | `/` | `<a href="/">` — full navigation |

### Push vs Replace

| Scenario | Method |
|---|---|
| `/select-role` legacy route | `<Navigate to="/roles" replace />` — **replace** |
| All other navigations | `navigate(path)` — **push** (default) |
| Auth redirect when already logged in | `navigate("/roles")` — push |
| Post-password-reset redirect | `navigate("/auth")` via `setTimeout` — push |

---

## C. Button Inventory

### Page: Home (`/`)

| Element | Action |
|---|---|
| Logo (Header) | → `/` (or `/roles` if logged in) |
| "Features" link | → `#features` anchor scroll |
| "Tenants" link | → `/tenant` |
| "Landlords" link | → `/landlord` |
| "Employees" link | → `/employee` |
| "Builders" link | → `/builder` |
| "Specialists" link | → `/specialists` |
| "Sign In" button | → `/auth` |
| "Get Started" button | → `/auth` |
| "Dashboard" button (logged in) | → role-based dashboard path |
| "Settings" button (logged in) | → `/profile` |
| "Sign Out" button (logged in) | Signs out → `/` |
| Role Switcher (logged in) | Switches active role |
| "Take a Tour" floating button | Starts driver.js tour |

### Page: Auth (`/auth`)

| Element | Action |
|---|---|
| "← Back to Home" button | → `/` |
| "Sign In" tab | Switches to sign-in form |
| "Sign Up" tab | Switches to sign-up form |
| "Sign In" submit | Authenticates → `/roles` |
| "Create Account" submit | Creates account → `/roles` |
| "Forgot password?" link | Switches to forgot-password mode |
| "← Back to Sign In" (forgot mode) | Returns to sign-in mode |
| "Send Reset Link" submit | Sends email, shows confirmation |
| Logo | Display only (no link) |

### Page: Role Dashboard (`/roles`)

| Element | Action |
|---|---|
| "N" logo link | → `/` |
| "Settings" button | → `/profile` |
| "Switch to Role" / "Go to Dashboard" | Switches role → navigates to role dashboard |
| "Create Role" button | Opens CreateRoleDialog |
| "Continue to [Role] Dashboard" | → role dashboard path |

### Page: Tenant Dashboard (`/tenant`)

| Element | Action |
|---|---|
| Logo (DashboardHeader) | → `/` |
| Role Switcher | Switches active role |
| Settings icon (mobile) | → `/profile` |
| "Sign Out" | Signs out → `/` |
| "Pay Rent" (quick action / tab button) | Opens PayRentDialog |
| "Report Issue" quick action | Switches to Maintenance tab |
| "View Lease" quick action | Switches to Lease tab |
| "Join Property" button | Opens JoinPropertyDialog |
| Tab triggers | Switches between Overview/Payments/Maintenance/Messages/Lease/Settings/Help |
| Mobile bottom nav | Switches tabs (Home/Pay/Issues/Chat/Help) |

### Page: Landlord Dashboard (`/landlord`)

| Element | Action |
|---|---|
| Logo (DashboardHeader) | → `/` |
| Role Switcher | Switches active role |
| "Find Specialists" button | → `/specialists` |
| "Sign Out" | Signs out → `/` |
| Mobile hamburger menu | Opens side-sheet with tab navigation |
| Tab triggers | Switches between Overview/Properties/Tenants/Employees/Salaries/Payments/Maintenance/Specialists/Messages/Reports |
| Property card click | → `/landlord/property/:propertyId` |

### Page: Property Detail (`/landlord/property/:id`)

| Element | Action |
|---|---|
| Logo (DashboardHeader) | → `/` |
| "← Back to Properties" | → `/landlord` with `{ activeTab: "properties" }` |
| SharePropertyCode button | Copies/shares property code |
| Tab triggers | Switches between Overview/Units/Tenants/Employees/Maintenance/Performance/Financials |

### Page: Employee Dashboard (`/employee`)

| Element | Action |
|---|---|
| Logo (DashboardHeader) | → `/` |
| Role Switcher | Switches active role |
| "Sign Out" | Signs out → `/` |
| Mobile hamburger menu | Opens side-sheet with tab navigation |
| Tab triggers | Switches between Overview/My Profile/Properties/Work Orders/Work History/Salary |

### Page: Builder Dashboard (`/builder`)

| Element | Action |
|---|---|
| Logo (DashboardHeader) | → `/` |
| "Find Specialists" button | → `/specialists` |
| "New Project" button | Opens CreateProjectDialog |
| "Sign Out" | Signs out → `/` |
| Project card click | → `/builder/project/:projectId` |

### Page: Project Detail (`/builder/project/:id`)

| Element | Action |
|---|---|
| "← Back to Dashboard" | → `/builder` |
| "Add Expense" button | Opens AddExpenseDialog |
| "Add Material" button | Opens AddMaterialDialog |
| Tab triggers | Switches between Expenses/Materials/Analytics |

### Page: Specialist Dashboard (`/specialist`)

| Element | Action |
|---|---|
| Header nav links | Same as Home header |
| "View Public Profile" | → `/specialist/:specialistId` |
| "Edit Profile" | → `/specialist/register` |
| "Complete Profile" button | → `/specialist/register` |
| "Create Specialist Profile" (no profile) | → `/specialist/register` |
| "Sign In" (not authenticated) | → `/auth` |
| Tab triggers | Switches between Overview/Earnings/Portfolio/Messages/Reviews/Jobs/Schedule |

### Page: Specialist Directory (`/specialists`)

| Element | Action |
|---|---|
| Header nav links | Same as Home header |
| Search input | Filters specialists by name/bio/area |
| Category dropdown | Filters by specialist category |
| Availability dropdown | Filters by availability status |
| "Register as Specialist" button | → `/specialist/register` |
| Specialist card click | → `/specialist/:specialistId` |
| "View Profile" button | → `/specialist/:specialistId` |
| Phone button | Opens `tel:` link |
| Email button | Opens `mailto:` link |

### Page: Specialist Registration (`/specialist/register`)

| Element | Action |
|---|---|
| "← Back to Directory" | → `/specialists` |
| Tab triggers | Switches between Profile/Skills/Certifications/Availability |
| "Save Profile" submit | Saves profile → `/specialists` |
| "Sign In" (not authenticated) | → `/auth` |

### Page: Specialist Profile (`/specialist/:id`)

| Element | Action |
|---|---|
| "← Back to Directory" | → `/specialists` |
| "Hire" button | Opens HireSpecialistDialog |
| "Message" button | Opens StartConversationDialog |
| "Write a Review" button | Shows ReviewForm inline |
| Tab triggers | Switches between Portfolio/Reviews/Skills & Certs/Availability |
| "Back to Directory" (not found) | → `/specialists` |

### Page: Profile Settings (`/profile`)

| Element | Action |
|---|---|
| "← Back to Dashboard" | → role-based dashboard |
| Camera icon | Opens file picker for avatar upload |
| "Save Changes" | Saves profile data |
| "Update Password" | Changes password |
| "Delete Account" | Opens confirmation dialog → deletes account → `/` |

### Page: Upgrade (`/upgrade`)

| Element | Action |
|---|---|
| "← Back" | `navigate(-1)` — browser back |
| Plan cards | Selects subscription plan |
| Payment method radio | Selects payment method |
| "Upgrade for K..." button | Creates subscription → `/specialists` |
| "Browse Specialists" (already Pro) | → `/specialists` |

### Page: Admin Dashboard (`/admin`)

| Element | Action |
|---|---|
| "← Back to Home" | → `/` |
| "Approve" button | Approves pending subscription |
| "Reject" button | Cancels pending subscription |
| "Create Subscription" button | Opens create subscription dialog |
| "Extend" menu item | Opens extend subscription dialog |
| Tab triggers | Switches between Pending Approvals/All Subscriptions/Memberships/Analytics |

### Page: Reset Password (`/reset-password`)

| Element | Action |
|---|---|
| "Update Password" submit | Updates password → auto-redirect to `/auth` after 3s |
| "Back to Login" (invalid link) | → `/auth` |
| "Go to Login" (success) | → `/auth` |

### Page: 404 Not Found

| Element | Action |
|---|---|
| "Return to Home" link | → `/` (full page navigation via `<a>`) |

---

### Common: DashboardHeader (used by Tenant, Landlord, Employee, Builder)

| Element | Action |
|---|---|
| Logo | → `/` |
| Role Switcher dropdown | Switches active role, navigates to new role's dashboard |
| User info pill | Display only |
| Settings icon (mobile) | → `/profile` |
| "Sign Out" button | Signs out → `/` |

### Common: Header (used by Home, Specialist pages)

| Element | Action |
|---|---|
| Logo | → `/` (or `/roles` if logged in) |
| Nav links | Feature anchor or role dashboard links |
| "Sign In" / "Get Started" | → `/auth` |
| "Dashboard" (logged in) | → role-based dashboard |
| "Settings" (logged in) | → `/profile` |
| "Sign Out" (logged in) | Signs out → `/` |
| Mobile menu toggle | Opens/closes mobile nav |
