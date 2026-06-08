# Meson Caller Team App

A PWA for Meson Agency's callers (AU + US): shifts, performance, pay, leave, HR docs, team chat. Installs to iOS/Android home screens, works offline-ready via the service worker.

## Stack

- Vite + React + TypeScript
- Tailwind CSS — "Liquid Glass" design system (charcoal #0a0a0c base, indigo #6366f1 accent)
- `@supabase/supabase-js` — auth, data, realtime
- `vite-plugin-pwa` — manifest + service worker
- `recharts` — performance charts
- `@tabler/icons-react` — outline icon set
- Inter (UI) + JetBrains Mono (numerics)

## Setup

```sh
cp .env.example .env   # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open http://localhost:5173 and sign in with an account that exists in `auth.users` AND has its `id` linked to `public.employees.supabase_uid`.

## Build

```sh
npm run build   # outputs ./dist
npm run preview
```

## Deploy (Netlify)

Meson's DNS is on Netlify.

1. Connect this repo in Netlify.
2. Build command: `npm run build` · publish dir: `dist`.
3. Add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Netlify dashboard.
4. SPA fallback is already provided at `public/_redirects`.

## Schema notes (verified against `meson-database`)

- `employees.supabase_uid` (uuid) is the auth-link column to `auth.users.id`.
- `employees."Country"` (capital C) holds the region — mapped to `AU` / `US` for timezone (AEDT vs ET) and currency (AUD vs USD).
- Timestamps on `shifts`, `messages`, `chat`, `message_reads` are **epoch milliseconds (`bigint`)**.
- `shifts.duration` and `shifts.working_duration` are **hours** (numeric).
- `shifts` has no `campaign_id` — derive via `calls.shift_id → calls.campaign_id` when needed.
- `campaigns.campaign_name` (not `name`), `clients.company_name`.
- `messages.sent_id` = sender employee id; `messages.Unseen` is capital U.

## Open RLS issues (flagged, NOT auto-fixed)

The Supabase advisor reports **16 tables with RLS disabled**. `pay_run` is caller-sensitive and fully exposed via the anon key. Review and enable before launch:

```sql
ALTER TABLE public.pay_run ENABLE ROW LEVEL SECURITY;

CREATE POLICY pay_run_self_select ON public.pay_run
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE supabase_uid = auth.uid()
    )
  );
```

Other RLS-disabled tables (review case-by-case):
`spatial_ref_sys, bonus, budget, google_oauth_credentials, setup_users, general_email_log, _diag_results, _csv_invoice_cmp, custom_forms, shifts_temp_delete_backup_*, rosters_temp_delete_backup_*, inbound_roster_temp_delete_backup_*, quo_numbers, sales_sms, aircall_numbers`.

Caller-scoped tables already have RLS enabled (`employees`, `shifts`, `leave_requests`, `hr_documents`, `chat`, `messages`, `message_reads`). Confirm the policies actually scope to `auth.uid()` via `employees.supabase_uid` before going live — RLS-enabled-with-no-policies blocks all reads.

## Design source

The design URL in the brief (`https://api.anthropic.com/v1/design/h/NBOEbcvubrO-3GTKnzhjvA`) returned 404 from the build environment, so the "Liquid Glass" spec from the prompt is the live source of truth in `src/index.css` + `tailwind.config.js`. Update those token files when the canonical design is available.

## Project layout

```
src/
  lib/        supabase client, formatters (tz/currency/epoch), shared types
  state/      AuthProvider — session + employee + region
  components/ Layout (mobile bottom nav), Glass primitives
  pages/      Login, Home, Shifts, Performance, Pay, More,
              Leave, Documents, Chat (list + room)
```

## Feature → table map

| Screen | Source |
| --- | --- |
| Home | `shifts` next/today/7d aggregates |
| Shifts | `shifts` upcoming vs completed (per-shift OPH / connect / calls) |
| Performance | `shifts` aggregated; benchmarks Manual 55 / Autodial 75 / EasyAML 50 |
| Pay | `pay_run`, currency from region |
| Leave | `leave_requests` — submit + history. Schema has no `type` column; leave type is implicit by region. |
| HR Docs | `hr_documents` (filters `deleted=false`) |
| Chat | `chat` + `messages` + `message_reads` with Supabase Realtime |
