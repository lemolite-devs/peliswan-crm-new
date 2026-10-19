# Peliswan CRM — v2 (live UI)

This is the Peliswan CRM front-end that gets hosted. It uses the existing
back-end (`../../back-end`) and the same logins. The old UI is kept in
`../v1` as an archive only.

Modules on v2 so far: **Leads** (list, filters, detail, activity log, add/edit,
convert to customer, delete, Excel export).

## Run locally

```bash
# back-end (port 9001)
cd back-end && npm run dev

# v2
cd front-end/v2
npm install          # first time only
npm run dev          # → http://localhost:3003
```

Settings live in `.env` (copy `.env.example`):

| Variable            | Example                 | What it is |
| ------------------- | ----------------------- | ---------- |
| `VITE_API_BASE_URL` | `http://localhost:9001` | Your back-end |
| `VITE_V1_URL`       | *(empty)*               | Optional. If set, modules not on v2 yet show in the sidebar and open the classic UI at this address. Empty = hidden. |

## Deploy on Vercel

Point the existing Vercel project at v2 so users keep the same URL:

1. Vercel → your project → **Settings → Build & Deployment**
   - **Root Directory:** `front-end/v2`
   - **Framework Preset:** Vite (build `npm run build`, output `dist` — also set in `vercel.json`)
2. **Settings → Environment Variables**
   - `VITE_API_BASE_URL` = your production back-end URL (the value v1 used for `REACT_APP_API_BASE_URL`)
   - Remove the old `REACT_APP_*` variables if you like; v2 ignores them.
3. **Redeploy.**

`vercel.json` already sends every route to `index.html`, so deep links such as
`/leads/123` work on refresh.

## How it is put together

```
src/
  lib/api.ts              one axios instance + Bearer token
  stores/authStore.ts     POST /api/login, permissions (Leads:view, Leads:add …)
  components/ui/          buttons, dialogs, selects…
  components/layout/      sidebar + top bar
  modules/leads/
    types.ts              back-end shapes, exactly as the API sends them
    api.ts                every /api/leads call this module makes
    adapter.ts            back-end shape ⇄ screen shape, form validation
    LeadsList.tsx         /leads
    LeadDetail.tsx        /leads/:id
    LeadForm.tsx          /leads/new  and  /leads/:id/edit
  routes.tsx              page routes
  lib/nav.ts              sidebar entries
```

## Adding the next module

1. Create `src/modules/<module>/` with `types.ts`, `api.ts` (reuse the existing
   endpoints), `adapter.ts` and the screens. `../v1/src` shows how the old
   screens called the API.
2. Add its routes in `src/routes.tsx`.
3. In `src/lib/nav.ts`, move it into the first group with a `path`.

The back-end stays as it is.
