# Epuka — Preventive Healthcare Operations Engine
### Project Brief v2.0 · April 2026

---

## 1. Mission

Epuka is a **workflow-first healthcare logistics platform** built for the Kenyan preventive health market. It coordinates every step of a diagnostic test — from a patient booking their first blood panel to a medical professional securely releasing their results — with strict operational accountability at every step.

> **Core Principle**: Every role in the system sees exactly what they need to do next. Nothing more. Nothing less.

---

## 2. System Architecture

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router, Server + Client Components) |
| **Database** | Firestore (NoSQL, real-time) |
| **Authentication** | Firebase Auth (Google OAuth) |
| **Maps** | Leaflet + OpenStreetMap (no paid API key required) |
| **Deployment** | Netlify (CI/CD via GitHub push) |
| **Styling** | Vanilla CSS (dark, operational UI) |
| **Language** | TypeScript (strict mode) |

---

## 3. Who Uses Epuka

### 👤 Patient
Books diagnostic tests, tracks their sample through the lab process, and receives interpreted results once a medical professional has reviewed and approved them.

### 🔧 OPS Team
Manages the logistics queue — verifying M-Pesa payments, coordinating home collection routes, and assigning samples to partner labs.

### 🔬 Medical Admin
Reviews raw lab values, uses the AI-assisted interpretation engine, and personally approves results before they are visible to patients. Urgent cases are locked until explicitly signed off.

### 🛡️ Super Admin
Full system access — manages user roles, views the complete immutable audit ledger, and can override any system state (with mandatory logging).

---

## 4. The Booking Lifecycle (State Machine)

Every booking in Epuka follows a strict, linear 9-step lifecycle. **No step can be skipped.**

```
BOOKED
  ↓  Patient submits booking
PAYMENT_PENDING
  ↓  OPS initiates payment verification
PAYMENT_CONFIRMED
  ↓  OPS assigns to partner lab
ASSIGNED_TO_LAB
  ↓  Courier picks up / patient visits lab
SAMPLE_COLLECTED
  ↓  Lab begins processing
IN_ANALYSIS
  ↓  Medical Admin enters and reviews results
VERIFIED
  ↓  Results approved and dispatched to patient
DELIVERED
  ↓  Cycle complete
CLOSED
```

All transitions are validated server-side. An OPS user cannot skip from `BOOKED` to `SAMPLE_COLLECTED`. A Medical Admin cannot release results from a booking still in `IN_ANALYSIS`. Every transition is recorded in an **immutable audit log**.

---

## 5. Operations Dashboard (Role-Based)

### OPS Queue (`/admin`)
| Queue | Trigger Condition |
|---|---|
| 🟡 New Bookings | `status = BOOKED` |
| 🟡 Payment Pending | `status = PAYMENT_PENDING` |
| 🟢 Ready for Collection | `status = PAYMENT_CONFIRMED` |
| 🔵 Active Logistics | `status = ASSIGNED_TO_LAB or SAMPLE_COLLECTED` |

### Medical Queue (`/admin`)
| Queue | Trigger Condition |
|---|---|
| 🔴 Urgent — Awaiting Sign-off | `flag = URGENT, medicalApprovalStatus = PENDING` |
| 🔵 Pending Review | `medicalApprovalStatus = PENDING` |
| 🟢 Approved Today | `medicalApprovalStatus = APPROVED` |

---

## 6. Medical Intelligence Layer

Epuka includes a **rule-based clinical guidance engine** (`src/lib/medical.ts`).

- Interprets common lab values: Glucose, Cholesterol (LDL/HDL), Blood Pressure, HbA1c
- Outputs a severity flag: `NORMAL` | `ATTENTION` | `URGENT`
- Detects anomalous readings (physiologically impossible values)
- All suggestions are labelled: **"Clinical Guidance Support — Not a Diagnosis"**

**Safety Lock**: Any result flagged `URGENT` is locked from patient view. It requires a Medical Admin to:
1. Manually confirm review
2. Document a follow-up action
3. Click explicit approval

---

## 7. Geolocation & Logistics Map

- **Patient Booking**: Pin-drop home collection location with automatic reverse geocoding (Nominatim API)
- **Lab Selection**: Interactive map showing all active partner labs
- **OPS Logistics View** (`/admin/logistics`): Live command map displaying all active collection points vs. destination labs for route coordination

---

## 8. Database Collections (Firestore)

| Collection | Purpose |
|---|---|
| `users` | Auth data, roles, demographic profiles |
| `bookings` | Full lifecycle record per test booking |
| `results` | Raw lab values, interpretations, approval status |
| `labs` | Dynamic registry of partner diagnostic centers |
| `audit_logs` | **Immutable**. Every admin action, timestamped |

---

## 9. Security Model (RBAC)

Firestore rules enforce role-based access at the database level:

- **Patients** can only read their own approved results (`medicalApprovalStatus = APPROVED`)
- **OPS** can read all bookings but cannot touch medical records
- **Medical Admins** can create/edit results but cannot access system settings
- **Audit logs** are **append-only** — no role can edit or delete them
- **Closed bookings** cannot be modified by any non-Super Admin

---

## 10. Live Routes

| Route | Who | Purpose |
|---|---|---|
| `/` | Public | Marketing landing page |
| `/tests` | Patient | Browse and book a test panel |
| `/dashboard` | Patient | Booking tracker + results portal |
| `/results` | Patient | Interpreted health results |
| `/onboarding` | Patient | Health profile setup |
| `/admin` | OPS + Medical | Today's Work Queue |
| `/admin/bookings` | OPS | Booking state management |
| `/admin/payments` | OPS | M-Pesa payment verification |
| `/admin/logistics` | OPS | Live collection map |
| `/admin/results` | Medical | Lab result entry + approval |
| `/admin/users` | Super Admin | Role management |
| `/admin/audit` | Super Admin | Immutable system audit log |

---

## 11. Deployment

- **Repository**: GitHub (`Speccraft2025/Epuka`)
- **CI/CD**: Every push to `main` triggers an automatic Netlify build
- **Environment**: Firebase keys stored as Netlify Environment Variables
- **Build**: `npm run build` → Next.js static + SSR output → `.next`

---

## 12. Current Status

| Area | Status |
|---|---|
| State Machine (9 states) | ✅ Live |
| RBAC Security Rules | ✅ Deployed to Firestore |
| OPS Logistics Map | ✅ Live |
| Medical Safety Lock | ✅ Live |
| Patient Lifecycle Tracker | ✅ Live |
| TypeScript Build | ✅ Clean (0 errors) |
| Netlify Deployment | 🔄 Deploying (latest push) |

---

*Epuka — Know your numbers before they know you.*
