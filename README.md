# Job Tracker (React + Vite + Vercel Serverless)

A simple, fast job application tracker. Add, edit, delete jobs; visualize your pipeline; and persist a light/dark theme. The app is a React + Vite frontend with serverless API routes deployed on Vercel. Storage uses Vercel KV when configured, with an in-memory fallback for previews/local.

---

## Features
- Create, edit, delete job applications (company, title, status, date, link, notes)
- Status pipeline: Applied · Interviewing · Offer · Rejected
- Dashboard charts (Recharts) to visualize your progress
- Light/Dark theme (stored via API)
- Zero-backend-ops: serverless functions under `my-app/api/`
hosted on vercel

https://job-tracker-2y7gpazeo-idris-projects-508cd8f1.vercel.app/

---

## Tech Stack
- React 18 + Vite
- Material UI (MUI)
- Recharts
- Vercel Serverless Functions (`my-app/api/`)
- Vercel KV (optional persistence)

---

## Project Structure
```
my-app/
  api/
    _lib/
      store.js            # storage helper (Vercel KV or in-memory fallback)
    jobs/
      index.js            # GET/POST /api/jobs
      [id].js             # PATCH/DELETE /api/jobs/:id
    settings/
      [id].js             # GET/PATCH /api/settings/:id (only `1` is used)
  src/
    api.js                # frontend API client (BASE = "/api")
    components/
      Header.jsx
      JobForm.jsx
      JobList.jsx
      Dashboard.jsx
    styles/
      App.css
      Dashboard.css
      JobList.css
      Job.css
      Header.css
    App.jsx
    main.jsx
    index.css
  vite.config.js          # dev proxy from /api -> http://localhost:3001
  package.json
  README.md
```

---

## Local Development
There are two recommended flows.

### Option A: Vite dev + JSON Server (fastest UI loop)
- Start the mock API (port 3001):
```bash
npm run api
```
This runs `json-server --watch db.json --port 3001` (create a simple `db.json` with `{"jobs":[], "settings":[{"id":1, "theme":"dark"}]}` if you want to test this path). The Vite dev server proxies `/api` to `http://localhost:3001` per `vite.config.js`.

- Start the frontend:
```bash
npm run dev
```
- Open http://localhost:5173

### Option B: Full stack locally with Vercel Dev
This runs both the Vite app and your Vercel Functions locally.

- Install Vercel CLI:
```bash
npm i -g vercel
```
- From `my-app/` run:
```bash
vercel dev
```
- Open the served URL. The `/api/*` routes are handled by your local serverless functions.

Note: Without Vercel KV env vars, data is in-memory and will reset on restarts/cold starts.

---

## API Endpoints (Serverless)
Base URL is `/api` in production and local Vercel dev.

- Jobs
  - `GET    /api/jobs`
  - `POST   /api/jobs` (body: `{ id?: string, company, title, status, date, link, notes }`)
  - `PATCH  /api/jobs/:id` (body: partial)
  - `DELETE /api/jobs/:id`

- Settings
  - `GET    /api/settings/1` → `{ id: 1, theme: "light" | "dark" }`
  - `PATCH  /api/settings/1` (body: `{ theme: "light" | "dark" }`)

---

## Key Files (Serverless)
- `api/_lib/store.js`
  - Detects Vercel KV via env vars and uses it if available.
  - Falls back to in-memory store for local/preview.
  - Exports: `getJobs`, `setJobs`, `getSettings`, `setSettings` and `store` wrapper.

- `api/jobs/index.js`
  - `GET /api/jobs` returns array of jobs.
  - `POST /api/jobs` creates a job. If `id` is missing, generates one via `randomUUID()` from `node:crypto`.

- `api/jobs/[id].js`
  - `PATCH /api/jobs/:id` partially updates a job.
  - `DELETE /api/jobs/:id` removes a job.

- `api/settings/[id].js`
  - `GET /api/settings/1` returns theme.
  - `PATCH /api/settings/1` updates theme.

---

## Environment Variables (Optional KV persistence)
Create a Vercel KV store and add the following env vars to your Vercel Project settings:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Then redeploy. Without these, the API will use in-memory storage.

---

## Build & Deploy (Vercel)
- Ensure your Vercel Project Root is the `my-app/` folder (so that `my-app/api/` is detected as functions).
- Defaults:
  - Build Command: `npm run build`
  - Output Directory: `dist`
- Push to `main` (or your chosen branch). Vercel will auto-deploy.

After deploy, verify in your browser DevTools → Network:
- `GET /api/settings/1` → 200 and JSON
- `GET /api/jobs` → 200 and array
- Create a job in the UI → `POST /api/jobs` → 201 and JSON

---

## Troubleshooting
- **404 on `/api/...` in production**
  - Your project root might not be `my-app/`, or functions aren’t in `my-app/api/`.
- **500 on `/api/...`**
  - Check Vercel → Project → Deployments → latest → Function Logs.
  - Common causes:
    - Wrong relative import to `../_lib/store.js`.
    - UUID generation using `crypto.randomUUID` without importing. Use `import { randomUUID } from "node:crypto"`.
    - Missing `@vercel/kv` dependency.
- **Data resets on reload**
  - You’re using the in-memory fallback. Configure Vercel KV env vars to persist.
- **Local dev hitting 404 for `/api`**
  - If using Vite dev without `vercel dev`, ensure json-server is running on port 3001 and the Vite proxy in `vite.config.js` is present.

---

## Scripts
- `npm run dev` → Vite dev server
- `npm run build` → Build the app (dist/)
- `npm run preview` → Preview built app
- `npm run api` → Run JSON Server on port 3001 (optional, for Vite-proxy dev)

---


## License
MIT
