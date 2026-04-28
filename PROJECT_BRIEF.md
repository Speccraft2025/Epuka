# Epuka: Preventive Healthcare Operations Engine

## 🏷️ Project Identity
**Project Name**: Epuka  
**Vision**: To democratize preventive healthcare in Kenya through a digital-first, operations-driven diagnostic platform.  
**Core Mission**: To move from "reactive" medicine to "proactive" health management by simplifying lab testing, result interpretation, and medical logistics.

---

## 🏗️ Technical Architecture
- **Framework**: Next.js 14 (App Router)
- **Primary Language**: TypeScript (100% Type Safe)
- **Database**: Google Firestore (NoSQL)
- **Authentication**: Firebase Auth (Google OAuth)
- **Mapping**: Leaflet + OpenStreetMap (Dynamic Pin-Drop & Reverse Geocoding)
- **Styling**: Vanilla CSS (Premium Dark Theme / Operational Minimalist UI)
- **Deployment**: Netlify (CI/CD Pipeline)

---

## ⚡ The "Operations Engine" Workflow
Epuka is built as a prioritized workflow engine, ensuring that every role in the health ecosystem has a clear "Today's Work" queue.

### 🧩 Role-Based Access Control (RBAC)
1.  **PATIENT**: Can book tests via interactive maps and view interpreted health results with visual range indicators.
2.  **OPS (Operations)**: Manages payment verification and sample collection logistics via the "Logistics Queue."
3.  **MEDICAL_ADMIN**: Reviews lab data, utilizes the AI Assistant for interpretations, and releases validated reports.
4.  **SUPER_ADMIN**: Oversees the entire system, manages staff roles, and monitors immutable audit logs.

---

## 🔬 Medical Intelligence Layer
The system includes a clinical logic engine (`src/lib/medical.ts`) designed to assist medical staff:
- **Auto-Interpretation**: Analyzes raw values for Cholesterol, Glucose, and Blood Pressure to suggest patient-friendly clinical notes.
- **Severity Flagging**: Automatically suggests `NORMAL`, `ATTENTION`, or `URGENT` status based on laboratory ranges.
- **Safety Lock**: Enforces a mandatory manual review and follow-up documentation for all **URGENT** cases before they can be released to patients.

---

## 📍 Geographical & Logistics Integration
- **Split-Screen Lab Selection**: Integrated map and list view for partner laboratory selection.
- **Home Collection Pin-Drop**: Interactive map interface that allows users to drop a pin at their exact location, capturing precise coordinates and reverse-geocoded addresses.
- **Admin Map Previews**: Real-time map rendering in the admin panel to assist nurses and couriers in finding collection sites.

---

## 📊 Data Schema Summary

### 1. `users`
Profiles containing authentication details, demographic data (age, gender, lifestyle), and system roles.

### 2. `bookings`
The central transaction record tracking test panels, collection methods, payment status, and precise geographical locations.

### 3. `results`
Medical reports containing raw indicators, visual range data, doctor's interpretations, and safety flags.

### 4. `labs`
A dynamic collection of partner diagnostic centers with coordinates, active status, and neighborhood details.

### 5. `audit_logs`
An immutable ledger of every administrative action, providing full transparency on status changes, payment approvals, and role updates.

---

## 🚀 Deployment & Maintenance
- **Environment**: Managed via `.env.local` for development and Netlify Environment Variables for production.
- **Security Rules**: Hardened `firestore.rules` that enforce RBAC at the database level, preventing unauthorized cross-collection access.
- **Scaling**: Built on a serverless architecture (Firebase + Next.js Server Components) to handle high concurrent traffic with zero server management overhead.
