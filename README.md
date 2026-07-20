# Job Tracker (React + Vite)

A fast, modern job application tracker. Sign up, add/edit/delete jobs, attach a CV and cover letter, visualize your pipeline on a Kanban board or table, and review your stats on Dashboard/Analytics pages. Auth, job data, and file attachments are backed by [Supabase](https://supabase.com) (Postgres + Auth + Storage).

Live: https://job-tracker-gilt-nine.vercel.app/

---

## Features
- Email/password signup & login via Supabase Auth
- Per-user job storage — jobs are scoped to `user_id`, so each account only sees its own data
- Create, edit, delete job applications (company, title, status, date, link, notes)
- Attach a CV and/or cover letter per job, uploaded to Supabase Storage; download links shown in the job details panel
- Status pipeline: Applied · Interviewing · Technical Test · Offer · Rejected
- Kanban board with drag-and-drop status changes
- Table view with a details panel for the selected job
- Dashboard charts (Recharts) and an Analytics page with monthly trends, offer rate, interview-to-offer conversion rate, best-performing month, and response rate broken down by role type (Frontend/Backend/Fullstack/DevOps/QA/Other, inferred from job title)
- CSV export of your job list
- Light/Dark theme, persisted via `localStorage`

---

## Tech Stack
- React 18 + Vite
- Material UI (MUI)
- Recharts
- `@hello-pangea/dnd` for drag-and-drop
- Supabase (`@supabase/supabase-js`) — Auth, Postgres (`jobs`, `settings` tables), and Storage (`job-attachments` bucket)

---

## Project Structure
```
src/
  api/
    api.js                # JobAPI / ThemeAPI — Supabase data client (jobs + settings tables)
    mockAuth.js            # Legacy localStorage mock auth — no longer imported, kept for reference
    mockJobs.js            # Legacy localStorage mock job storage — no longer imported, kept for reference
  context/
    AuthContext.jsx        # React context wrapping Supabase Auth: { user, loading, error, signup, login, logout }
  pages/
    LoginPage.jsx          # Logged-out screen shown by default
    SignupPage.jsx         # Logged-out screen, toggled from LoginPage
  components/
    Header.jsx
    Sidebar.jsx
    JobForm.jsx            # Add/edit dialog; also handles CV & cover letter upload to Supabase Storage
    JobList.jsx
    JobDetails.jsx          # Detail panel for the selected job in table view (status, notes, attachments)
    KanbanBoard.jsx
    StatusTimeline.jsx
    Dashboard.jsx
    Analytics.jsx
    Settings.jsx
  utils/
    stats.js                # totals, success rate, plus role-based response rate / interview conversion / best month
    validation.jsx
    exportCsv.js
  styles/
    App.css
    Dashboard.css
    JobList.css
    Job.css
    JobDetails.css
    Header.css
    Sidebar.css
    Settings.css
  supabaseClient.js          # Creates the Supabase client from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
  theme.js
  App.jsx
  main.jsx
  index.css
api/                         # Legacy Vercel serverless functions (jobs/settings) — unused, predates the Supabase migration
db.json                      # Legacy json-server fixture — unused, predates the Supabase migration
vite.config.js
package.json
README.md
```

---

## Local Development

### 1. Set up a Supabase project
Create a project at [supabase.com](https://supabase.com), then:
- Enable **Email** auth under Authentication → Providers.
- Create a `jobs` table with (at minimum) columns: `id`, `user_id`, `company`, `title`, `status`, `date`, `link`, `notes`, `cv_url`, `cover_letter_url`, `created_at`.
- Create a `settings` table with columns: `user_id`, `theme`.
- Add Row Level Security policies scoping both tables to `auth.uid() = user_id`.
- Create a public Storage bucket named `job-attachments` for CV/cover letter uploads.

### 2. Configure environment variables
Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run the app
```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign up with any email/password — this creates a real user in your Supabase project.

---

## Data & Persistence

- **Auth** (`src/context/AuthContext.jsx`, `src/supabaseClient.js`) — Supabase Auth handles signup/login/session/logout; the session is restored on load via `supabase.auth.getSession()` and kept in sync with `onAuthStateChange`.
- **Jobs** (`src/api/api.js` → `JobAPI`) — CRUD against the Postgres `jobs` table, filtered by `user_id` so accounts only see their own applications.
- **Attachments** (`src/components/JobForm.jsx`) — CVs and cover letters are uploaded to the `job-attachments` Storage bucket; the resulting public URLs are stored on the job row as `cv_url` / `cover_letter_url`.
- **Theme** (`src/api/api.js` → `ThemeAPI`, and a `localStorage` fallback in `App.jsx`) — theme preference is persisted to the `settings` table per user and mirrored to `localStorage`.

> `src/api/mockAuth.js`, `src/api/mockJobs.js`, the root `api/` directory, and `db.json` are leftovers from earlier iterations of this project (a pure client-side mock, then a Vercel-serverless/json-server backend) before it migrated to Supabase. They are not imported anywhere in the current app.

---

## Scripts
- `npm run dev` → Vite dev server
- `npm run build` → Build the app (`dist/`)
- `npm run preview` → Preview built app
- `npm run lint` → Run ESLint

---

## Roadmap / Known Limitations
- Search and status-filter state exist in `App.jsx` but aren't currently wired to visible UI controls.
- No automated tests yet.
- `LoginPage.jsx` still shows a hardcoded demo-account hint (`test@example.com` / `password123`) — that account only works if it's been created in your own Supabase project.

See `PROJECT_DOCUMENTATION.md` for an in-depth, file-by-file walkthrough of the codebase, architecture review, and full improvement roadmap.

---

## License
MIT
