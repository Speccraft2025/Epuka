# Epuka Handover Documentation

This document provides a comprehensive handover of the **Epuka** project for Claude, ensuring a seamless transition without missing a beat.

---

## 📋 Project Overview
**Epuka** is a workflow-driven, preventive healthcare logistics platform custom-tailored for the Kenyan market. It handles the entire diagnostic test lifecycle: from user test panel booking (lab visit or home sample collection with interactive mapping) to secure medical data entry, automated clinical guidance, payment verification (M-Pesa), and granular Role-Based Access Control (RBAC).

---

## 🛠️ Tech Stack & Infrastructure
*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript (Strict Mode)
*   **Database & Backend**: Firebase (Auth, Firestore, Hosting)
*   **CSS/Styling**: Vanilla CSS (Custom dark theme with premium clinical accents)
*   **Mapping**: Leaflet + OpenStreetMap (No paid Google Maps API keys required)
*   **Deployment**: Netlify (CI/CD via GitHub commits on `main`)

---

## 🧱 Project Architecture & Key Entry Points

### 📁 Core Files & Directory Structure
*   [`src/lib/types.ts`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/src/lib/types.ts): Contains core type definitions including the 9-stage booking statuses, roles, panel types, and partner lab definitions (`STATIC_LABS`).
*   [`src/lib/medical.ts`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/src/lib/medical.ts): Contains clinical guidance logic, range checks, and interpretation formulas for diagnostic metrics.
*   [`src/lib/firebase.ts`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/src/lib/firebase.ts): Handles Firebase initialization.
*   [`src/lib/firestore.ts`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/src/lib/firestore.ts): Data-layer functions for patients (booking, updating onboarding details).
*   [`src/lib/admin.ts`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/src/lib/admin.ts): Data-layer functions for roles (`OPS`, `MEDICAL_ADMIN`, `SUPER_ADMIN`), transaction transitions, payment confirmations, and audit log generation.
*   [`firestore.rules`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/firestore.rules): Security rules deployed to Cloud Firestore enforcing RBAC, preventing unauthorized modifications, and keeping audit logs append-only.

### 🛣️ Application Routes
*   `/` ([`src/app/page.tsx`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/src/app/page.tsx)): Landing page.
*   `/tests` ([`src/app/tests/`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/src/app/tests/)): Patient-facing booking and panel selection.
*   `/onboarding` ([`src/app/onboarding/`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/src/app/onboarding/)): Initial user profile setup.
*   `/dashboard` ([`src/app/dashboard/`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/src/app/dashboard/)): Real-time booking tracking and progress timeline.
*   `/results` ([`src/app/results/`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/src/app/results/)): Results center showcasing interactive clinical ranges, gauges, and doctor interpretations.
*   `/admin` ([`src/app/admin/`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/src/app/admin/)): Unified operational dashboard.
    *   `/admin/bookings` - Booking queues and state-machine advancement.
    *   `/admin/payments` - M-Pesa transaction matching and verification.
    *   `/admin/logistics` - Live mapping of sample pickups and lab targets.
    *   `/admin/results` - Medical results entry with clinical guidance.
    *   `/admin/users` - Role manager (Super Admin only).
    *   `/admin/audit` - Append-only system ledger logs (Super Admin only).

---

## ⚙️ The Booking State Machine
Every booking follows a strict, sequential 9-step flow validated database-side:
1.  `BOOKED`: Patient submits test.
2.  `PAYMENT_PENDING`: Patient submits M-Pesa transaction code.
3.  `PAYMENT_CONFIRMED`: Verified by OPS matching statements.
4.  `ASSIGNED_TO_LAB`: OPS assigns the nearest partner lab.
5.  `SAMPLE_COLLECTED`: Courier picks up / patient walks in.
6.  `IN_ANALYSIS`: Lab analyzes sample.
7.  `VERIFIED`: Medical Admin enters values, approves interpretation.
8.  `DELIVERED`: Results dispatched and viewable by patient.
9.  `CLOSED`: Final archival state (read-only).

---

## 🔒 Security & Medical Safety Lock
*   **RBAC**: Restricted collection updates defined in [`firestore.rules`](file:///Users/speccraftmedialtd./Documents/Web/Epuka/firestore.rules). Patients can only read their results when `medicalApprovalStatus = APPROVED` and `status = DELIVERED`.
*   **Safety Lock**: If the rule-based clinical guidance flags a reading as `URGENT`, the results are **locked** from the patient's dashboard. A Medical Admin must manually review, write clinical follow-up actions, and explicitly override and sign off to approve the dispatch.

---

## 🕒 Recent Updates & Commit History
1.  **Mobile Optimization (`51a57475`)**: Full optimization for mobile devices. Implemented touch targets, location search, mobile-responsive leaflet maps, and a collapsible hamburger menu.
2.  **Documentation (`7ffbe533`)**: Updated project brief to version 2.0.
3.  **TS Alignment (`31983d01`)**: Aligned historical legacy state references with the new 9-step state machine, eliminating compilation/build errors.
4.  **Admin Verification (`1d1e685c`)**: Standardized function signatures for `adminVerifyPayment` on the payment verification views.
5.  **Logistics fixes (`6a0e72bc`)**: Added missing `Link` import within `/admin/logistics`.

---

## 🚀 Execution & Command Reference
*   **Run Local Dev**: `npm run dev`
*   **Build Check**: `npm run build`
*   **Deploy Firestore Rules**: `npx firebase deploy --only firestore:rules`
*   **Environment Configs Required**:
    *   `NEXT_PUBLIC_FIREBASE_API_KEY`
    *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
    *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
    *   `NEXT_PUBLIC_FIREBASE_APP_ID`
