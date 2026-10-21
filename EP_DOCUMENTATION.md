# Epuka Health Platform: Project Brief & Usage Manual

Epuka is a preventive healthcare platform designed for the Kenyan market, enabling seamless laboratory test booking, secure medical data management, and simplified health insights.

---

## 🚀 Project Brief

### Vision
To empower Kenyans with "Know Your Health, Act Before It's Late" through accessible, digital-first preventive medicine.

### Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Styling**: Vanilla CSS (Premium Dark Mode)
- **Backend**: Supabase (Postgres, Auth, Row Level Security)
- **Deployment**: Netlify (CI/CD)
- **Security**: Granular RBAC (Role-Based Access Control)

### Key Features
- **Location-Aware Booking**: Choose between partner lab visits or home sample collection.
- **Visual Health Panels**: Lab results translated into intuitive gauges and plain-language interpretations.
- **Admin Control System**: Comprehensive operations center for logistics, payments, and medical validation.

---

## 📖 User Manual (Patient)

### 1. Booking a Test
1.  **Select Test**: Browse panels (Basic, Heart, Full Body) and click **Book Now**.
2.  **Authenticate**: Sign in with Google, or with a one-time link sent to your email.
3.  **Choose Collection**:
    - **Lab Visit**: Select the nearest partner lab from our map-integrated list.
    - **Home Collection**: Provide your physical address for a mobile nurse visit.
4.  **Schedule**: Select your preferred date.
5.  **Payment**: Note the total, pay via M-Pesa, and input the Transaction Code. Our team confirms it against the M-Pesa statement.

### 2. Viewing Results
- Access the **My Results** dashboard.
- Metrics are grouped by health category (Metabolic, Lipid, etc.).
- Hover over the **ⓘ icon** for plain-language medical explainers.
- Use the **Range Bar** to see where your values sit relative to healthy clinical levels.

---

## 🔐 Admin Usage Manual (Operations)

### Accessing the Control Center
The admin panel is located at `/admin`. You must have an authorized role (`SUPER_ADMIN`, `MEDICAL_ADMIN`, or `OPS`) assigned by a Super Admin in `/admin/users` (the very first Super Admin is set in the Supabase SQL editor; see `HANDOVER_CLAUDE.md`).

### 1. Bookings Management (All Admins)
- View the master list of all appointments.
- Filter by lifecycle status (`BOOKED` through `CLOSED`).
- Advance bookings one step at a time as logistics progress. The database rejects skipped steps.

### 2. Payment Verification (Super Admin & Ops)
- View bookings awaiting payment confirmation.
- Match user-provided M-Pesa codes against bank statements.
- **Approve** to unlock the booking for medical processing.

### 3. Medical Results Management (Super Admin & Medical Admin)
- Secure portal for entering lab data.
- **Format**: Input raw data as JSON (for visual gauges) or plain text.
- **Interpretation**: Add simplified doctor notes to help the patient understand their health status.
- **Urgent cases**: an URGENT flag requires a documented follow-up action and a manual-review confirmation.
- **Action**: Click **Approve & Release**. The booking moves to `VERIFIED`, the result is signed off under your name, and the booking moves to `DELIVERED`, which makes it visible to the patient.

### 4. User Access & Audit (Super Admin Only)
- **User Roles**: Assign staff to specific roles (e.g., promoting a user to Medical Admin).
- **Audit Logs**: View an immutable stream of all system actions. Every status change, payment approval, and result release is logged with a timestamp and the responsible admin's ID.

---

## 🛠️ Technical Administration

### Environment Variables
The following must be configured in Netlify/Production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Both are public values and are already set in `netlify.toml`.

### Schema & Security Changes
The schema, access rules and audit triggers live in `supabase/migrations/`. Add a new timestamped migration file for each change, apply it to the Supabase project, then regenerate `src/lib/database.types.ts`.

### Adding New Partner Labs or Test Panels
Insert rows into the `labs` or `tests` tables (Super Admin only). The app reads both from the database.

---

## ⚠️ Safety & Compliance
- **Medical Disclaimer**: Interpretations are supportive only; users are encouraged to consult their primary physicians.
- **Data Privacy**: All patient data is protected by Postgres Row Level Security that restricts access to the account owner and authorized medical staff only.
