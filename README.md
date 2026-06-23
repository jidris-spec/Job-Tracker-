# Job Tracker (React + Vite)

A fast, modern job application tracker. Sign up, add/edit/delete jobs, visualize your pipeline on a Kanban board or table, track status-change history, and review your stats on Dashboard/Analytics pages. Authentication and job data are currently mocked client-side via `localStorage`, so the app runs fully standalone with no backend setup required.

Live: https://job-tracker-gilt-nine.vercel.app/

---

## Features
- Email/password signup & login (mock auth, scoped per browser via `localStorage`)
- Per-user job storage — each account only sees its own jobs
- Create, edit, delete job applications (company, title, status, date, link, notes)
- Status pipeline: Applied · Interviewing · Offer · Rejected
- Kanban board with drag-and-drop status changes
- Application timeline: every status change is recorded with a date and shown as a visual history in the edit form
- Stale-application badges in the table view (flags active applications with no status change in 7+ days)
- Dashboard charts (Recharts) and Analytics page (monthly trends, response/offer rate) to visualize your progress
- CSV export of your job list
- Light/Dark theme, persisted via `localStorage`

---

## Tech Stack
- React 18 + Vite
- Material UI (MUI)
- Recharts
- `@hello-pangea/dnd` for drag-and-drop
- Mock auth + job storage backed by `localStorage` (see [Data & Persistence](#data--persistence))

---

## Project Structure
```
src/
  api/
    api.js              # JobAPI / ThemeAPI — frontend data client
    mockAuth.js          # Mock auth backed by localStorage (signup/login/logout)
    mockJobs.js          # Per-user job storage backed by localStorage
  context/
    AuthContext.jsx      # React context exposing { user, signup, login, logout }
  pages/
    LoginPage.jsx
    SignupPage.jsx
  components/
    Header.jsx
    Sidebar.jsx
    JobForm.jsx
    JobList.jsx
    KanbanBoard.jsx
    StatusTimeline.jsx  # renders a job's statusHistory as a vertical timeline
    Dashboard.jsx
    Analytics.jsx
    Settings.jsx
  utils/
    stats.js
    validation.jsx
    exportCsv.js
  styles/
    App.css
    Dashboard.css
    JobList.css
    Job.css
    Header.css
    Sidebar.css
    Settings.css
  theme.js
  App.jsx
  main.jsx
  index.css
api/                     # Legacy Vercel serverless functions (jobs/settings) — unused by the current
                         # mock-auth build; kept for reference / future real-backend migration
vite.config.js
package.json
README.md
```

---

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173, then sign up with any email/password (it's stored in `localStorage`) — or use the seeded demo account:

- **Email:** `test@example.com`
- **Password:** `password123`

No environment variables, database, or API server are required to run the app locally.

---

## Data & Persistence

This build uses a fully mocked, client-side persistence layer:

- **Auth** (`src/api/mockAuth.js`) — stores a list of users and the current session under `mock_users` / `current_user` in `localStorage`. Passwords are stored in plain text — this is a mock for demo/portfolio purposes only and is **not** suitable for production use.
- **Jobs** (`src/api/mockJobs.js`) — stores each user's jobs under a `user_jobs_<uid>` key in `localStorage`, so different accounts in the same browser don't see each other's data.
- **Theme** — persisted via `localStorage` (`theme` key), independent of the mock auth/job storage.

Because everything lives in `localStorage`, data is per-browser and will be lost if the user clears site data. There is no cross-device sync.

> The `api/` directory at the project root contains an earlier Vercel-serverless implementation (with optional Vercel KV persistence) that the app no longer calls into. It's kept for reference if/when the project migrates to a real backend.

---

## Scripts
- `npm run dev` → Vite dev server
- `npm run build` → Build the app (`dist/`)
- `npm run preview` → Preview built app
- `npm run lint` → Run ESLint

---

## Roadmap / Known Limitations
- Auth and job storage are mocked (`localStorage`) — not secure, not persisted across devices/browsers. Replacing this with a real backend (auth provider + database) is the main next step.
- Search and status-filter state exist in `App.jsx` but aren't currently wired to visible UI controls.
- No automated tests yet.

See `PROJECT_DOCUMENTATION.md` for an in-depth, file-by-file walkthrough of the codebase, architecture review, and full improvement roadmap.

---

## License
MIT
