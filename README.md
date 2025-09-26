Paste **everything below** into your `README.md`:

```markdown
# Job Application Tracker (React + Vite)

Track job applications, visualize progress with a donut chart, and switch between light/dark mode.  
Backend uses **JSON-Server** in development (you can swap in a real API later).

---

## ✨ Features
- Create / edit / delete job applications
- Statuses: **Applied · Interviewing · Offer · Rejected**
- **Dashboard**: Recharts donut + right legend with counts and %
- **Dark mode** via CSS variables (persists to localStorage)
- Clean React components and simple CSS

---

## 🧱 Tech Stack
- **React + Vite**
- **Recharts** (charts)
- **JSON-Server** (mock API for dev)
- Plain **CSS** tokens for theming

---

## 📂 Project Structure
```

src/
App.jsx
api.js
utils/stats.js
components/
Header.jsx
JobForm.jsx
JobList.jsx
Dashboard.jsx
styles/
Dashboard.css
JobList.css
index.css
db.json
vite.config.js (optional proxy)

````

---

## 🚀 Quick Start (Development)

### 1) Install
```bash
npm install
````

### 2) Start the API (JSON-Server)

Create/confirm `db.json`:

```json
{
  "jobs": [],
  "settings": [{ "id": 1, "theme": "light" }]
}
```

Run it:

```bash
npx json-server --watch db.json --port 3000 --cors
```

Check: open [http://localhost:3000/settings/1](http://localhost:3000/settings/1) — you should see JSON.

### 3) Environment

Create `.env.local` in the project root:

```
VITE_API_URL=http://localhost:3000
```

### 4) Run the app

```bash
npm run dev
```

---

## 🔌 API Endpoints (JSON-Server)

**Jobs**

* `GET    /jobs`
* `POST   /jobs`        (body: job)
* `PATCH  /jobs/:id`    (body: partial)
* `DELETE /jobs/:id`

**Settings**

* `GET    /settings/1`
* `PATCH  /settings/1`  (body: `{ "theme": "dark" }` or `"light"`)

> If you prefer `/api/...` URLs, use a Vite proxy that rewrites `/api` → backend.

---

## 🧩 Key Files

### `src/api.js`

```js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function http(url, options = {}) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.status === 204 ? null : res.json();
}

export const JobAPI = {
  list: () => http(`${BASE}/jobs?_sort=id&_order=desc`),
  create: (job) => http(`${BASE}/jobs`, { method: "POST", body: JSON.stringify(job) }),
  update: (id, partial) => http(`${BASE}/jobs/${id}`, { method: "PATCH", body: JSON.stringify(partial) }),
  remove: (id) => http(`${BASE}/jobs/${id}`, { method: "DELETE" }),
};

export const SettingsAPI = {
  get: () => http(`${BASE}/settings/1`),
  setTheme: (theme) => http(`${BASE}/settings/1`, { method: "PATCH", body: JSON.stringify({ theme }) }),
};
```

### `src/utils/stats.js`

```js
export default function getJobStats(jobs = []) {
  const totals = { total: jobs.length, Applied: 0, Interviewing: 0, Offer: 0, Rejected: 0 };
  for (const j of jobs) if (totals[j.status] != null) totals[j.status]++;
  const successRate = totals.total > 0 ? Math.round((totals.Offer / totals.total) * 100) : 0;
  return { totals, successRate };
}
```

### Dark Mode Tokens (`src/index.css`)

```css
html, body, #root { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--fg); }

:root{
  --bg:#f5f7fb; --fg:#111827;
  --card-bg:#ffffff; --card-border:#e5e7eb;
  --muted:#6b7280; --header-bg:#f3f4f6;
}
html[data-theme="dark"]{
  --bg:#0b1220; --fg:#e5e7eb;
  --card-bg:#0f172a; --card-border:#1f2937;
  --muted:#9ca3af; --header-bg:#111827;
}
.app{ min-height:100%; background:var(--bg); color:var(--fg); }
```

---

## 🛠 Optional: Vite Proxy for `/api/*`

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api/, ''), // /api/jobs -> /jobs
      },
    },
  },
})
```

---

## 🩹 Troubleshooting

* **404 at `:5173/api/...`** → You’re hitting Vite, not the backend. Use `VITE_API_URL` or enable the proxy + rewrite.
* **CORS** → run JSON-Server with `--cors` or call through the Vite proxy.
* **“Unexpected token” / “return outside function”** → remove merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`); ensure `return` is inside a component function.
* **IDs (string vs number)** → JSON-Server uses numeric `id`. Normalize when comparing.

---

## 🗺 Roadmap

* Filters/search/sort
* CSV/PDF export
* Auth (per user data)
* Notes/reminders per application
* Pagination & server-side search

````

After pasting, run:
```bash
git add README.md
git commit -m "Add project README"
git push origin main
````
