# Epuka

Workflow-first preventive-healthcare logistics for Kenya: test booking, M-Pesa payment verification, home collection and lab routing, medical review, and secure release of results.

- **Stack:** Next.js 14 · TypeScript · Supabase (Postgres, Auth, RLS) · Leaflet/OpenStreetMap · Netlify
- **Docs:** [`HANDOVER_CLAUDE.md`](HANDOVER_CLAUDE.md) (technical handover + setup checklist), [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md), [`EP_DOCUMENTATION.md`](EP_DOCUMENTATION.md) (user/admin manual), [`BUSINESS.md`](BUSINESS.md)

## Run locally

```bash
cp .env.example .env.local   # fill in the publishable key
npm install
npm run dev                  # http://localhost:3000
```

## Database

Schema, access rules and audit triggers live in `supabase/migrations/`. Apply them in filename order to the Supabase project, then regenerate `src/lib/database.types.ts`.
