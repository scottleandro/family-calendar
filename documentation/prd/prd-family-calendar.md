# Family Calendar - Product Requirements Document (PRD)

## 1) Executive Overview
The Family Calendar is a simple, delightful calendar app designed for single-household (single family) use. It emphasizes quick event creation, easy categorization, and a beautiful UI that works great on mobile. Authentication is lightweight with enforced password rotation every 15 days to keep access limited to household members only.

This PRD documents:
- Current behavior and constraints (as-implemented)
- Near-term improvements prioritized for performance and mobile UX

Primary success metric: fast perceived load time on mobile and frictionless event entry for family members.

---

## 2) Goals & Non-Goals
- Goals
  - Provide a shared household calendar with simple event creation and category tagging
  - Make it feel instant on mobile (fast loads and snappy interactions)
  - Keep auth simple but secure enough for a family (15-day password expiry)
- Non-Goals (for now)
  - Multi-household tenancy, invites, any external sharing
  - Reminders/notifications, email digests
  - Admin/roles/permissions beyond basic sign-in

---

## 3) Target Users
- Primary: Household family members using mobile devices
- Secondary: Same users on desktop for occasional planning/printing

---

## 4) Current Product Scope (As Implemented)

### 4.1 Authentication & Security
- Email + password sign-up/sign-in via Supabase
- Email confirmation (configurable in Supabase) supported
- Password expiration enforced every 15 days
- Middleware guards all pages except auth and health
- Change Password flow for expired/soon-to-expire passwords

### 4.2 Calendar & Events
- Views: Month and Week views
- Create/Edit Events
  - Title, optional description
  - All-day vs date/time
  - Single instance or recurrence (weekly/monthly basic support)
  - Time zone captured per event
  - Category (single select) with color; category color decorates event
- Event persistence via Postgres (Prisma)
- Drag to create in UI, edit via dialog, drag/resize single-instance events
- Recurring series edit handled via form (drag/resize restricted)

### 4.3 Categories (Tags)
- Each user automatically receives a default set of 8 categories on first use
  - Work, Personal, Family, Health, Education, Travel, Social, Hobby
- Users can rename categories (double-click to edit) and the changes persist in DB
- Categories are per-user; unique by (userId, name)

### 4.4 Profile & Session Management
- Profile dialog: shows email, user ID, password expiry date, days remaining
- Actions: Change Password, Log Out

### 4.5 Platform & Performance
- Next.js App Router, React 19, Vercel hosting
- Prisma + Postgres (Supabase)
- Build includes prisma generate safeguards for Vercel
- Client and server Supabase clients configured via NEXT_PUBLIC envs
- Mobile-first responsive UI with fast interactive times

---

## 5) Functional Requirements (Current)

### FR-1 Authentication
- Users can: sign up, verify email (if enabled), sign in, sign out
- Middleware redirects unauthenticated users to sign-in
- Passwords expire every 15 days; expired users are redirected to change password

### FR-2 Event Management
- Users can create, edit, and delete single-instance events
- Users can create recurring events (basic weekly/monthly)
- Event fields: title (required), description (optional), all-day, start/end, recurrence, category, timezone
- Event color is derived from the selected category

### FR-3 Categories
- On first access, system seeds per-user default categories
- Users can rename categories; updates persist and are user-specific
- Category list is fetched from API and cached client-side in state for the session

### FR-4 Profile
- Users can view profile info and password status
- Users can change password, which resets expiry to +15 days
- Users can log out and are redirected to sign-in

### FR-5 Printing
- Users can print the calendar from the UI

---

## 6) Non-Functional Requirements (Current)
- NFR-1 Performance: Prioritize fast load on mobile (TTI and FCP under ~2s on modern phones over normal networks)
- NFR-2 Reliability: Basic uptime via Vercel; app should be tolerant of transient API errors (graceful UI fallbacks)
- NFR-3 Security: Family-only access; 15-day password rotation; no PII beyond email stored
- NFR-4 Accessibility: Reasonable keyboard and contrast; full WCAG compliance not mandated in this phase

---

## 7) Constraints & Assumptions
- Single-family usage; all authenticated users are considered household members with equal capabilities
- No external invites/sharing/ACLs in scope
- No notifications/reminders in scope

---

## 8) Success Metrics (Current)
- Median mobile FCP < 2s; TTI < 2.5s for calendar view
- New event creation flow time < 10 seconds (from dialog open to save)
- Category rename reflects in UI within 1s and persists across sessions

---

## 9) Risks
- Password rotation could confuse users if they don’t regularly sign in; mitigate with clear messaging in Profile and redirect flow
- Recurrence editor is intentionally minimal; complex recurrence needs are out of scope
- No offline mode; requires network connectivity

---

## 10) Near-Term Roadmap (3–8 weeks)

### A. Performance & Mobile UX (Priority)
1. Optimize calendar initial data payload (lazy range loading, server pagination by visible window)
2. Client-side request coalescing and caching for categories and events
3. Preload critical CSS and fonts; reduce bundle size (tree-shake FullCalendar plugins per active view)
4. Add skeleton states for calendar grid and initial fetch
5. Tune image/icon assets; prefer SVG sprites where possible

### B. Event & Category UX
1. Quick-add from month grid (tap day → inline title, defaults, save)
2. Category management page (add/delete/reorder; keep rename in dialog)
3. Color picker for categories with accessible palette
4. Better recurrence presets: every weekday, every other week, custom end date

### C. Reliability/Quality
1. API input validation via Zod on server (events/tags)
2. 429/backoff and retry for transient failures
3. Add minimal health endpoint that checks DB connectivity

### D. Auth & Security
1. Add gentle in-app reminder banner when < 5 days to password expiry
2. Optional 2FA (email OTP) toggle in Supabase (later; keep off by default)

---

## 11) Future (Nice-to-Have, not committed)
- Household sharing with roles (Parent, Kid), per-event visibility
- Reminders/notifications (push/email) and daily agenda
- iCal import/export
- Offline-first (Service Worker) and PWA install
- Multi-household tenancy

---

## 12) Acceptance Criteria (Current Release)
- A new user can sign up, sign in, see default categories, create/edit an event, rename a category, and log out — all on mobile — within performant thresholds.
- An expired-password user is redirected to change password and can resume work after update.
- Category changes persist across logouts and device changes for the same user.

---

## 13) Open Questions
- Should we add a dedicated “Today” floating action button on mobile for quick navigation?
- Do we need a per-user setting for first day of week (Sunday vs Monday)?
- Should we expose a minimal settings screen (timezone defaults, print options)?

