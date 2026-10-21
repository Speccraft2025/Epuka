# Epuka Handover

Current state of the project for whoever picks it up next. Last updated 21 Oct 2026.

---

## What Epuka is
A workflow-driven preventive-healthcare logistics platform for Kenya. It runs the whole life of a diagnostic test: booking (lab visit or home collection on a map), M-Pesa payment verification, lab assignment and sample collection, medical review with rule-based clinical guidance, and secure release of results. Access is role-based (RBAC).

## Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript strict |
| Database | Supabase Postgres, project **Epuka Project** (`dzflksuhykpeupznqibt`, eu-west-3) |
| Auth | Supabase Auth: Google OAuth + email magic link |
| Security | Row Level Security + database triggers (see `supabase/migrations`) |
| Maps | Leaflet + OpenStreetMap / Nominatim (no paid keys) |
| Styling | Vanilla CSS, dark clinical theme |
| Hosting | Netlify, auto-deploys from `main` on GitHub `Speccraft2025/Epuka` |

Firebase was removed on 21 Oct 2026. Any data still in the old Firestore project was **not** migrated.

## Key files
- `src/lib/supabase.ts`: lazily-created browser client (`getSupabase()`).
- `src/lib/data.ts`: patient-side data layer, plus the row ↔ app-type mappers (`toBooking`, `toResult` and so on) and `unwrap`/`unwrapOne`, which turn Supabase `{ data, error }` responses into exceptions.
- `src/lib/admin.ts`: staff data layer. Covers transitions, payment verification, `adminReleaseResult`, roles and the audit log.
- `src/lib/types.ts`: app-facing camelCase types (`AppUser`, `UserProfile`, `Booking`, `Result`, `AuditLog`).
- `src/lib/database.types.ts`: types generated from the schema. Regenerate after any schema change.
- `src/contexts/AuthContext.tsx`: session, role, onboarding state, `signIn`/`signInWithGoogle`/`signInWithEmail`/`logout`, and `homeFor(role, profileComplete)`.
- `src/app/login`: sign-in page. `src/app/auth/callback`: OAuth/magic-link landing page.
- `supabase/migrations/*.sql`: the schema, security model and audit triggers. These are the source of truth.

## Routes
`/` landing · `/login` · `/auth/callback` · `/tests` booking · `/onboarding` · `/dashboard` · `/results` ·
`/admin` work queues · `/admin/bookings` · `/admin/payments` · `/admin/logistics` · `/admin/results` · `/admin/users` (Super Admin) · `/admin/audit` (Super Admin)

## Booking state machine (enforced in the database)
`BOOKED → PAYMENT_PENDING → PAYMENT_CONFIRMED → ASSIGNED_TO_LAB → SAMPLE_COLLECTED → IN_ANALYSIS → VERIFIED → DELIVERED → CLOSED`
(`BOOKED` and `PAYMENT_PENDING` may also go to `CLOSED`.)

- The `bookings_guard_update` trigger rejects any jump that isn't in `private.booking_transitions`. SUPER_ADMIN may override, and an override is logged as `SUPER_ADMIN_OVERRIDE_TRANSITION`.
- A patient may only attach an M-Pesa code and move `BOOKED → PAYMENT_PENDING`. They cannot mark themselves paid.
- OPS confirms payment (`payment_status = paid`, `PAYMENT_CONFIRMED`). For a `BOOKED` order, the app steps it through `PAYMENT_PENDING` first.
- A medical admin releases results with `adminReleaseResult`. That walks the booking to `VERIFIED`, inserts the result as `APPROVED` with `approved_by`/`approved_at`, then moves the booking to `DELIVERED`.

## Security model
- **Patients** see their own profile, their own bookings, and their own results, but results only once the result is `APPROVED` **and** the booking is `DELIVERED`/`CLOSED`.
- **OPS** see all bookings and profiles. They have no access to results at all.
- **Medical admins** read and write results and move bookings.
- **Super admins** can do everything, including roles and the audit log.
- **Safety lock:** the `urgent_requires_follow_up` constraint means an URGENT result cannot be approved without a written follow-up action. The UI also asks the reviewer to confirm a manual review.
- **Audit log:** written only by database triggers, in the same transaction as the change. Clients have no insert, update or delete rights. Logged actions:
  - `TRANSITION_BOOKING_STATE`
  - `SUBMITTED_PAYMENT_CODE`
  - `VERIFIED_PAYMENT`
  - `CREATED_MEDICAL_RESULT`
  - `MEDICAL_APPROVAL_CHANGED`
  - `UPDATED_USER_ROLE`
- **Roles:** only a SUPER_ADMIN, or SQL run in the Supabase dashboard, can change a role. A new signup always gets a `profiles` row with role `PATIENT`.

## Shared Supabase project
The SHIFT app (`shift-epuka.netlify.app`) uses the same Supabase project and auth user pool. Its tables are prefixed `shift_`. A SHIFT signup also gets an Epuka `profiles` row (as a PATIENT). That is harmless.

## Setup checklist (Supabase dashboard)
1. **Migrations:** apply everything in `supabase/migrations` in filename order, if it isn't already applied. `20261021090000_audit_labels.sql` is new as of 21 Oct.
2. **Auth → URL configuration:** add `https://<epuka-netlify-domain>/auth/callback` and `http://localhost:3000/auth/callback` to the redirect allow-list.
3. **Auth → Providers → Google:** enable it with a Google OAuth client ID and secret. The Google console redirect URI is `https://dzflksuhykpeupznqibt.supabase.co/auth/v1/callback`. Email magic links work without this step.
4. **First Super Admin:** sign in once, then in the SQL editor run
   `update public.profiles set role = 'SUPER_ADMIN' where email = 'you@example.com';`
   After that, manage roles from `/admin/users`.

## Commands
- `npm run dev`: local dev. Needs `.env.local` with the two `NEXT_PUBLIC_SUPABASE_*` values; see `.env.example`.
- `npm run build`: type-check and production build.
- Public Supabase URL and publishable key for Netlify builds live in `netlify.toml`.

## Known gaps
- No automated tests yet. The 21 Oct migration work was checked against a local Postgres: role rules, state machine, safety lock, result visibility and audit entries.
- `epuka-v1/node_modules` (≈20k files) is committed to the repo by mistake and should be removed.
- No M-Pesa API integration yet. Payment codes are matched by hand.
- There is no screen for approving a result left `PENDING`, because results are created already signed off.
