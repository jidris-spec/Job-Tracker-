# Job Tracker — Complete Engineering Documentation

> Written for a developer joining the team who is still learning React.
> Every section explains things in plain English first, then in technical terms.
>
> **Updated:** this revision reflects the addition of a mocked authentication
> system (signup/login/logout, per-user data namespacing) and an expanded
> analytics engine (role-based response rates, interview conversion, best
> month). The previous revision described a real fetch-based backend as the
> live data layer — that is no longer accurate; see Section 0 and Section 4.

---

## 0. The Big Picture (read this first)

Think of this app like a personal CRM for your job hunt. Instead of tracking
customers, you track job applications: who you applied to, what stage you're
at (Applied → Interviewing → Offer/Rejected), and notes about each one.

It now has **three** conceptual layers, only two of which are actually live:

1. **Frontend UI** (`src/components`, `src/pages`) — what the user sees and
   clicks.
2. **Frontend "backend"** (`src/api`, `src/context`) — a client-side-only data
   layer. Auth and job data both live in `localStorage`, wrapped behind small
   API-shaped modules (`MockAuthAPI`, `MockJobsAPI`) so the rest of the app
   *feels* like it's talking to a server, but no network request is ever made
   for jobs or authentication.
3. **Real backend** (`api/` at the project root, `db.json`, `json-server`) —
   a genuine serverless API (Vercel functions + Vercel KV) that was clearly
   the *original* plan. **The frontend no longer calls any of it.** It's fully
   wired, deployable, and dead — a "filing cabinet" that's still standing in
   the warehouse but nobody has the key to it anymore. This is the single
   biggest architectural fact to understand about this codebase: it evolved
   from "real backend" → "local-only mock," and the old backend was never
   deleted (Section 7 covers why that matters).

The app is also now gated behind a **login wall**: `App.jsx` renders either
the signup/login screen or the real app, depending on whether `AuthContext`
currently holds a `user`. Every job is stored under a per-user key
(`user_jobs_<uid>`) in `localStorage`, so two different accounts on the same
browser don't see each other's data — a real multi-tenancy instinct, even
though the "backend" is just the browser's own storage.

---

## 1. Project Structure (Complete File Tree)

```
Job-Tracker-/
├── package.json                  # Project metadata, scripts, dependencies
├── vite.config.js                # Build tool config + local API proxy (now unused by the live app)
├── eslint.config.js              # Linting rules
├── db.json                       # Seed data for json-server — legacy, unused by the live app
│
├── api/                          # LEGACY — Vercel serverless backend, no longer called by the frontend
│   ├── _lib/
│   │   └── store.js              # Shared storage logic (KV or in-memory)
│   ├── jobs/
│   │   ├── index.js              # GET /api/jobs, POST /api/jobs
│   │   └── [id].js                # PATCH /api/jobs/:id, DELETE /api/jobs/:id
│   └── settings/
│       └── [id].js                # GET/PATCH /api/settings/:id (theme persistence)
│
├── dist/                         # Build output (generated, not hand-edited)
│
└── src/                          # Frontend — React application
    ├── main.jsx                  # Entry point — boots the app into the DOM, wraps it in AuthProvider
    ├── App.jsx                   # Auth gate + root "MainApp" component owning all app-wide state
    ├── theme.js                  # MUI theme factory (light/dark palettes)
    ├── index.css                 # Global resets
    │
    ├── api/                      # Frontend's mocked data-access layer
    │   ├── api.js                 # JobAPI (delegates to MockJobsAPI) + ThemeAPI (dead code, still fetch-based)
    │   ├── mockAuth.js            # MockAuthAPI — fake signup/login/logout backed by localStorage
    │   └── mockJobs.js            # MockJobsAPI — fake per-user job CRUD backed by localStorage
    │
    ├── context/
    │   └── AuthContext.jsx        # Global auth state (user, signup, login, logout) via React Context
    │
    ├── pages/
    │   ├── SignupPage.jsx         # The screen actually shown when logged out — handles BOTH signup and login
    │   └── LoginPage.jsx          # A separate login-only screen — built, but never imported/rendered anywhere
    │
    ├── components/
    │   ├── Header.jsx             # Top bar: page title, Add/Edit/Delete/Export/Theme/Logout buttons
    │   ├── JobForm.jsx            # Modal dialog: create & edit job form
    │   ├── JobList.jsx            # Table view of all jobs ("Applications" page)
    │   ├── KanbanBoard.jsx        # Drag-and-drop board view (Kanban) — correctly cased now, see 2.13
    │   ├── Dashboard.jsx          # "Dashboard" page — KPIs + recent activity + donut chart
    │   ├── Analytics.jsx          # "Analytics" page — monthly bar chart + role-based insights (expanded)
    │   ├── Settings.jsx           # "Settings" page — theme toggle + CSV export + summary stats
    │   ├── Sidebar.jsx            # Left navigation rail
    │   └── StatusTimeline.jsx     # Vertical timeline showing a job's status history
    │
    ├── utils/
    │   ├── validation.jsx         # URL validation/normalization (despite .jsx extension, no JSX inside)
    │   ├── stats.js               # Pure function: jobs[] -> totals + success rate + role/time insights (expanded)
    │   └── exportCsv.js           # Converts jobs[] into a downloadable CSV file
    │
    └── styles/
        ├── App.css, Header.css, Dashboard.css, JobList.css, Job.css,
        └── Settings.css, Sidebar.css      # Plain CSS, one file per component family
```

**Analogy:** `src/` is the showroom floor of a car dealership (what customers
interact with). `src/api` + `src/context` are a *prop* filing cabinet the
showroom staff wheel around to look official — it's actually just a locked
drawer in the showroom itself (`localStorage`), not a real warehouse. `api/`
at the project root and `db.json` are the *real* warehouse that was built
first, then abandoned when the team decided to demo everything client-side.

---

## 2. File-by-File Documentation

### 2.1 `src/main.jsx` — The Entry Point

**Purpose:** The first JavaScript that runs. Finds `<div id="root">` in
`index.html` and tells React to render the component tree inside it.

**What changed:** The tree mounted is no longer just `<App />` — it's now:

```jsx
<React.StrictMode>
  <AuthProvider>
    <App />
  </AuthProvider>
</React.StrictMode>
```

**Why `AuthProvider` wraps `App` here and not somewhere deeper:** Context
providers only make their value available to *descendants*. Since `App.jsx`
itself needs to read `user` from `AuthContext` (to decide whether to show the
login screen or the real app), the provider must sit *above* `App` in the
tree — wrapping it in `main.jsx` is the only place that guarantees that.

**If this file were removed:** Nothing would ever render — blank white page.

---

### 2.2 `src/App.jsx` — Auth Gate + Root "Brain" Component

**Purpose:** This file now does two jobs stacked on top of each other:

1. **`App` (the default export)** — a thin **auth gate**. It reads `user`
   from `AuthContext`. If there's no logged-in user, it renders `SignupPage`
   and stops — nothing else in the app ever mounts. If there is a user, it
   renders `MainApp`.
2. **`MainApp` (an internal, unexported component)** — everything the
   previous revision of this document described as "`App.jsx`": the central
   nervous system owning `jobs`, `activePage`, selection state, edit state,
   filters, and theme. Every page (Dashboard, Applications, Analytics,
   Settings) is a child that receives data and callbacks from `MainApp`.

```jsx
export default function App() {
  const { user } = useContext(AuthContext);
  if (!user) return <SignupPage />;
  return <MainApp />;
}
```

**Why split into two components instead of an `if` inside one function:**
`MainApp` calls hooks (`useState`, `useEffect`) unconditionally at its top
level. If the gating logic and the job-tracking logic lived in one function,
an early `return <SignupPage />` before those hooks ran would violate the
Rules of Hooks the moment `user` changed from `null` to a real value (hooks
must run in the same order on every render). Splitting into two components
sidesteps that entirely — `MainApp` only ever mounts (and only ever calls its
hooks) once a user exists.

**Imports explained (delta from previous revision):**

| Import | Why needed | If removed |
|---|---|---|
| `useContext` (added to the React import) | Reads `AuthContext` in both `App` and `MainApp` | `user` would be undefined; app would crash trying to destructure it |
| `AuthContext` from `./context/AuthContext.jsx` | The source of truth for who's logged in | No way to gate the app — everyone would see `MainApp` immediately, and `user.uid` would be undefined everywhere it's used for data scoping |
| `SignupPage` from `./pages/SignupPage.jsx` | The screen shown when logged out | Logged-out users would see a blank app instead of a way to sign up |
| `JobAPI` from `./api/api.js` (moved from `./api.js`) | Same role as before — create/read/update/delete jobs | `MainApp` couldn't load or persist any data |

Note the old `SearchIcon` unused import from `@mui/icons-material/Search` is
**gone** — it's no longer present in the current file, so that particular
piece of dead code has been cleaned up since the last revision.

**State Analysis — what's new:** All the state described in the previous
revision (`jobs`, `loading`, `error`, `activePage`, `selectedJobId`,
`isEditing`, `editingJob`, `query`, `statusFilter`, `sortBy`, `view`, `mode`)
is unchanged in shape. What's new is that **every data operation is now
scoped by `user.uid`**:

```js
const { user } = useContext(AuthContext); // inside MainApp too

useEffect(() => {
  if (!user) return; // guards against a stale render before logout finishes
  (async () => {
    setLoading(true);
    const data = await JobAPI.list(user.uid);
    setJobs(data);
    ...
  })();
}, [user]);

const handleCreateJob = async (job) => {
  const created = await JobAPI.create(user.uid, job);
  ...
};
```

- **Why `[user]` is now a dependency of the load effect:** If a different
  account logs in without a full page reload, this effect needs to re-run and
  fetch *that* user's jobs instead of continuing to show the previous user's
  in-memory `jobs` state.
- **Why the guard `if (!user) return;`:** Because `MainApp` only ever renders
  when `user` is truthy (enforced by the `App` gate above), this guard is
  technically redundant in normal operation — but it's a defensive line
  against the brief render that happens *during* `logout()` before `App`
  swaps back to `SignupPage`, preventing a call to `JobAPI.list(undefined)`.

**`handleUpdateJob`/`handleDeleteJob`:** Unchanged in shape from the previous
revision, except every `JobAPI` call now takes `user.uid` as its first
argument, so a user can never accidentally read or mutate another account's
localStorage-namespaced job list.

**Everything else** (the `filtered` derived list, `toggleTheme`, the
`muiTheme` memo, the JSX composition of `Sidebar`/`Header`/pages, the
Table/Board toggle) is materially unchanged from the previous revision — see
Section 4 for the updated ownership diagram.

**Still true (not fixed):** `query`, `statusFilter`, and `sortBy` exist and
feed the `filtered` computation, but there is still no visible search box or
filter dropdown wired to them anywhere in `MainApp`'s JSX. This was flagged
before and remains an open issue (Section 7).

---

### 2.3 `src/context/AuthContext.jsx` — Global Auth State (NEW)

**Purpose:** The React Context that makes "who is logged in" available to any
component in the tree without manually passing it down through props —
`App.jsx` needs it for gating, `Header.jsx` needs it to wire up the Logout
button, and neither is a direct parent/child of the other.

**Shape:**
```js
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = MockAuthAPI.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const signup = async (email, password) => { ... };
  const login  = async (email, password) => { ... };
  const logout = () => { MockAuthAPI.logout(); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, error, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**The mount-time effect:** Runs once, checks `localStorage` (via
`MockAuthAPI.getCurrentUser()`) for an already-logged-in session, and
restores it into state. This is what makes a page refresh **not** log the
user out — without it, `user` would always start `null` and every refresh
would dump you back to the signup screen even with valid session data sitting
in storage.

**Why `signup`/`login` wrap their calls in `try/catch` and re-throw:** They
update `error` state (for anyone who wants to read it from context) *and*
re-throw, so the calling component (`SignupPage`) can also catch the error
locally and show it inline next to the form — both the global `error` and a
local one end up set, which is slightly redundant (see Section 7) but
harmless.

**Note:** `loading` and `error` are exposed on the context but **`loading` is
never read anywhere else in the app** — `App.jsx`'s gate checks `user`
directly, not `loading`, so there's a theoretical flash-of-signup-page on
first load before the mount effect finishes (in practice it resolves
synchronously from `localStorage`, so this is invisible, but it's not
actually guarded against).

**If this file were removed:** `App.jsx`, `Header.jsx`, `SignupPage.jsx`, and
`LoginPage.jsx` would all fail to import `AuthContext` and crash at build
time.

---

### 2.4 `src/pages/SignupPage.jsx` — The Actual Logged-Out Screen

**Purpose:** The only auth screen actually wired into the app. Despite the
name, it handles **both** signup and login behind a single `isSignup`
boolean toggle — clicking "Sign Up" / "Login" at the bottom of the form flips
which mode it's in and which `AuthContext` function (`signup` vs `login`) the
form submits to.

**Why one component for both, rather than routing to `LoginPage.jsx`:**
There's no router in this app (Section 7), so "navigating" to a login screen
would mean more `activePage`-style string-state plumbing. Toggling a boolean
inside one component sidesteps that entirely — cheap and effective, though it
does mean `LoginPage.jsx` sitting right next to it is now orphaned (Section
2.5).

**Local state:** `email`, `password`, `error` (a local copy, redundant with
`AuthContext`'s `error` — see 2.3), `isSignup`.

**`handleSubmit`:**
```js
if (isSignup) {
  await signup(email, password);
} else {
  await login(email, password);
}
```
On success, nothing further happens here — `AuthContext.signup`/`login`
already called `setUser(...)` internally, which flips `App.jsx`'s gate and
unmounts `SignupPage` in favor of `MainApp` automatically. `SignupPage`
itself never needs to know that happened; it just stops being rendered.

**Demo credentials hint:** The form displays `test@example.com` /
`password123` under the Login mode — this matches the seed account
`MockAuthAPI` creates automatically on first use (see 2.7).

**UX/code-quality note:** All styling here is inline `style={{...}}` objects,
unlike every other page/component in the app, which uses `.css` files. This
is a genuine inconsistency (see Section 7) — likely because this screen was
built quickly as a functional stopgap rather than polished to match the rest
of the app's design system.

---

### 2.5 `src/pages/LoginPage.jsx` — Orphaned Component (NEW file, unused)

**Purpose (as written):** A login-only form — same fields, same
`AuthContext.login` call — structurally almost identical to `SignupPage.jsx`
with `isSignup` hardcoded away.

**Why it's dead code:** Nothing in the app imports it. `App.jsx` only ever
renders `SignupPage` for logged-out users, and `SignupPage` already contains
a full login flow internally. `LoginPage.jsx` was very likely an earlier
attempt at splitting signup/login into two screens that was abandoned in
favor of the toggle-based single screen, and never deleted.

**Risk of leaving it in place:** None functionally (it's never imported, so
it can't run), but it's a maintenance trap — a future developer might edit
`LoginPage.jsx` expecting their change to take effect, and be confused when
nothing changes in the running app. Should be deleted or explicitly wired up
via a real router (Section 9).

---

### 2.6 `src/api/api.js` — The (Now Partially Fake) Network Layer

**Purpose:** Previously (see the earlier revision of this document) this was
a thin `fetch()` wrapper hitting a real backend. It has been rewritten:

```js
import { MockJobsAPI } from "./mockJobs";

export const JobAPI = {
  async list(userId)            { return MockJobsAPI.getJobs(userId); },
  async create(userId, job)     { return MockJobsAPI.createJob(userId, job); },
  async update(userId, id, p)   { return MockJobsAPI.updateJob(userId, id, p); },
  async remove(userId, id)      { return MockJobsAPI.deleteJob(userId, id); },
};

export const ThemeAPI = {
  async get()      { /* still does a real fetch to /api/settings/1 */ },
  async set(mode)  { /* still does a real fetch to /api/settings/1 */ },
};
```

**What actually changed:** `JobAPI` no longer performs any `fetch()` call at
all — every method is `async` only for interface-compatibility with callers
that `await` it; internally it's a synchronous `localStorage` read/write via
`MockJobsAPI`. The **shape** callers depend on (`list`, `create`, `update`,
`remove`, all taking a `userId` first) is preserved, which is exactly why
`App.jsx` didn't need to change its calling convention beyond adding
`user.uid` as an argument — a real, if accidental, demonstration of why the
adapter/facade pattern is valuable: the data source was swapped out entirely
and the rest of the app didn't notice.

**`ThemeAPI` is still present, still does real `fetch()` calls to
`/api/settings/1`, and is still never imported or called anywhere in the
app** (theme persists via `localStorage` directly in `App.jsx`, same as
before). This is now doubly dead: not only is it unused, but even if
something did call it, it would be hitting an `api/settings/[id].js`
endpoint that nothing serves in the current deployment model.

**If `api.js` were removed:** `MainApp` couldn't talk to job storage at all;
its data-load effect would throw `JobAPI is not defined`.

---

### 2.7 `src/api/mockAuth.js` — `MockAuthAPI` (NEW)

**Purpose:** A fake authentication backend, entirely `localStorage`-based,
exposing `signup`, `login`, `getCurrentUser`, and `logout`.

**Storage keys:**
- `mock_users` — a JSON array of *every* account ever signed up, each record
  `{ uid, email, password, createdAt }`.
- `current_user` — the currently-logged-in session, `{ uid, email }` (no
  password), separate from the full user record.

**`initializeMockUsers()`:** Runs at the top of both `signup` and `login`.
Checks whether `mock_users` exists yet in `localStorage`; if not, seeds it
with one demo account (`test@example.com` / `password123`) so the app is
usable out of the box without requiring a real signup first — this is the
account `SignupPage.jsx`'s hint text advertises.

**`signup(email, password)`:**
1. Ensures the seed user exists.
2. Rejects if a user with that email already exists (`throw new Error("User
   already exists")`).
3. Builds a new user record with `crypto.randomUUID()` as `uid` — the same
   Web Crypto API used elsewhere in the app (`JobForm`'s job IDs) for
   collision-free client-generated identifiers.
4. **Stores the password in plain text** in `mock_users` — explicitly
   commented in the source (`// In real app, this would be hashed!`) as a
   known, deliberate shortcut.
5. Immediately logs the new user in by writing `current_user`, then returns
   `{ uid, email }` (password stripped) to the caller.

**`login(email, password)`:** Looks up a user whose `email` *and* `password`
both match exactly (`===`), throws `"Invalid email or password"` if not
found, otherwise writes `current_user` and returns `{ uid, email }`.

**`getCurrentUser()`:** A synchronous read of `current_user` — this is what
`AuthContext`'s mount effect calls to restore a session across page
refreshes.

**`logout()`:** Just removes the `current_user` key. Note it does **not**
touch `mock_users` (the account still exists) or that user's
`user_jobs_<uid>` data (Section 2.8) — logging out never deletes anything,
it only forgets which account is "current."

**Business/security caveat worth being able to explain in an interview:**
Storing plaintext passwords, even in a browser-only mock with no server
component, is something you'd never do in a real product — there's no
hashing (bcrypt/argon2), no salting, no rate-limiting on login attempts, and
`localStorage` is trivially readable by any script running on the page
(including a successful XSS payload). It's completely appropriate for a
portfolio/demo project that explicitly has no real backend, but it's
important to be able to say *why* this would never ship as-is.

---

### 2.8 `src/api/mockJobs.js` — `MockJobsAPI` (NEW)

**Purpose:** A fake per-user job store, entirely `localStorage`-based.

**Storage key pattern:** `user_jobs_<userId>` — e.g.
`user_jobs_3f2a1c9e-...`. This is the concrete mechanism behind the
"multi-tenancy" claim in Section 0: every read/write is namespaced by
`userId`, so switching accounts (even within the same browser) genuinely
switches which job list you see.

**Methods — all synchronous under the hood, `async`-flavored only for
call-site compatibility:**
- `getJobs(userId)` — reads and `JSON.parse`s the key, or returns `[]` if
  nothing's stored yet (first-time user).
- `saveJobs(userId, jobs)` — `JSON.stringify`s the *entire* array and
  overwrites the key. Every single mutation (create/update/delete)
  round-trips the whole list through this — fine at personal-tracker scale,
  a rewrite-amplification concern at any larger scale (same caveat the old
  in-memory backend had, just moved to the browser).
- `createJob(userId, job)` — assigns an `id` via `crypto.randomUUID()` only
  if the caller didn't already supply one (`job.id ||
  crypto.randomUUID()`), `unshift`s it onto the array (newest-first, matching
  the old backend's behavior), saves, and returns the new record.
- `updateJob(userId, jobId, partial)` — a plain `.map` merge
  (`{ ...j, ...partial }` for the matching id), saves, returns the updated
  record.
- `deleteJob(userId, jobId)` — filters the matching id out, saves, returns
  `true`.

**What's missing compared to the old real backend
(`api/jobs/index.js`/`[id].js`):** The old serverless backend automatically
**seeded and appended to `statusHistory`** on create/update — that business
rule lived entirely server-side. `MockJobsAPI.createJob`/`updateJob` do
**not** do this; they just merge whatever fields the caller passes in
verbatim. This means the status-history feature described in Section 6 now
depends entirely on the *frontend* (`JobForm.jsx`'s `handleSubmit`, and
`KanbanBoard.jsx`'s drag handler) to correctly build and pass a
`statusHistory` array as part of the `partial`/`job` object — there's no
server-side safety net enforcing that rule anymore. Worth double-checking
`JobForm.jsx` still does this correctly whenever it's touched, since the
guarantee moved from "always true, enforced centrally" to "true as long as
every caller remembers to do it."

---

### 2.9 `src/theme.js` — MUI Theme Factory

Unchanged from the previous revision — a pure `createAppTheme(mode)` factory
producing a full MUI theme (palette, typography, component overrides) for
light/dark mode. See prior documentation content; no behavioral delta.

---

### 2.10 `src/components/Header.jsx` — Top Bar / Toolbar (Logout added)

**Purpose:** Unchanged core role — page title + action buttons (Edit,
Delete, Export, Theme toggle, Add Job) — plus one new button.

**What's new:**
```js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
...
const { logout } = useContext(AuthContext);
const handleLogout = () => { logout(); };
...
<button onClick={handleLogout} style={{ ... inline styles ... }}>
  Logout
</button>
```

- **Placement:** Rendered as a plain, inline-styled `<button>` sitting
  alongside the MUI `Button` components used for every other action in the
  toolbar — a small visual/consistency inconsistency (every other button here
  is a themed MUI `Button`; this one is raw HTML with hand-written inline
  styles that don't respond to the dark/light theme the same way).
- **Effect on the rest of the app:** Clicking it calls `AuthContext.logout()`
  directly — no confirmation dialog (unlike Delete, which has one). This
  immediately clears `current_user` and sets context `user` to `null`, which
  flips `App.jsx`'s gate back to `SignupPage` and unmounts the entire
  `MainApp` tree, discarding all in-memory state (`jobs`, `selectedJobId`,
  filters, etc.) — which is fine, since it's all reloadable from
  `localStorage` next login, but it does mean an accidental click loses your
  place in the UI (e.g., an open edit modal) with zero warning.

**Everything else in this file** (the `open`/`confirmDelete` local state, the
`isEditing`-driven `useEffect`, `handleClose`, `PAGE_META`, props) is
unchanged from the previous revision.

---

### 2.11 `src/components/JobForm.jsx` — Create/Edit Modal

Unchanged in structure and behavior from the previous revision: one
dual-mode (`open`/`setOpen` controlled-or-uncontrolled) dialog for both
create and edit, the "status change date" conditional field, the
`StatusTimeline` embed, `crypto.randomUUID()` for new job IDs, and
`validateAndNormalizeUrl` gating submission.

**One consequence of the backend swap worth flagging here (see 2.8):** this
component is now the *only* place that constructs the initial
`statusHistory: [{ status, date }]` entry for a newly created job, and the
only place that appends a new entry when editing changes `status`. Previously
this was enforced twice — once optimistically on the client, once
authoritatively on the server, with the server's version always winning.
Now there is no server-side version to fall back on or reconcile against —
whatever `JobForm` sends is exactly what gets persisted.

---

### 2.12 `src/components/JobList.jsx` — Table View

Unchanged from the previous revision — `STALE_DAYS = 7`, `ACTIVE_STATUSES`,
`daysSince`/`lastActivityDate`, row selection/highlighting, the stale-badge
logic. No auth or storage-layer changes affect this component; it only ever
sees whatever `jobs` array `MainApp` passes it.

---

### 2.13 `src/components/KanbanBoard.jsx` — Drag & Drop Board View (casing bug fixed)

**Purpose:** Unchanged — a Trello-style board, one column per status, using
`@hello-pangea/dnd` for drag mechanics; dropping a card in a new column calls
`onUpdate(jobId, { status: newStatus })`, the same `handleUpdateJob`/
`JobAPI.update` path the edit form uses.

**What changed:** The file is now correctly named `KanbanBoard.jsx`
(capital K), matching the import in `App.jsx` (`import KanbanBoard from
"./components/KanbanBoard.jsx"`). The previous revision of this document
flagged a real bug here — a lowercase `kanbanBoard.jsx` file being imported
with an uppercase path, which works by accident on case-insensitive
filesystems (Windows/default macOS) but would break the production build on
a case-sensitive one (most Linux CI/CD, including Vercel's build
containers). **That bug has been fixed** — this is a good, concrete sign of
iterative cleanup happening alongside feature work.

**Still true (not fixed):** Every visual style in this file is still a JS
object passed to inline `style={{...}}`, unlike every other component, which
uses `.css` files — and the `COLORS` map here is still independently
duplicated from `Dashboard.jsx`/`Analytics.jsx` rather than shared (Section
7).

**Important nuance carried over:** Dragging a card still does **not** prompt
for a status-change date the way the edit form does — it silently records
"today" (now via `MockJobsAPI.updateJob`'s bare merge, since there's no
backend defaulting logic anymore either — see 2.8). Whatever date value ends
up in the new `statusHistory` entry is whatever `KanbanBoard.jsx`'s
`onDragEnd` constructs client-side.

---

### 2.14 `src/components/Dashboard.jsx` — Overview Page

Unchanged from the previous revision. Still a fully stateless, derived-only
view: `getJobStats(jobs)` for KPI numbers, a defensive `[...jobs].sort(...)`
copy before sorting `recent`, a donut chart with a CSS-overlaid center label.
Continues to only destructure `{ totals, successRate }` from `getJobStats` —
it does not use any of the new fields described in 2.20, so it's unaffected
by the stats-engine expansion.

---

### 2.15 `src/components/Analytics.jsx` — Trends Page (substantially expanded)

**Purpose:** Still the deeper, time-based analysis page, but it now surfaces
meaningfully more insight than before by consuming the expanded
`getJobStats` (Section 2.20) instead of computing everything locally.

**What's new:**
```js
const { totals, successRate, responseByRole, interviewConversionRate, bestMonth }
  = getJobStats(jobs);
```

- **Two new KPI cards:** "Interview Conversion" (`interviewConversionRate`,
  i.e. what fraction of jobs that reached "Interviewing" ultimately became
  "Offer") and, conditionally (only if there's at least one job with a
  parseable date), "Best Month" — the calendar month with the highest
  response rate, showing that month's name, its response rate, and how many
  applications went out that month.
- **A brand-new third panel, "Response Rate by Role":** iterates
  `responseByRole` (keyed by a role type auto-detected from each job's title
  — "Frontend"/"Backend"/"Fullstack"/"DevOps"/"QA"/"Other", see 2.20) and
  renders one row per role with its response-rate percentage. This is a
  real, if simple, step toward the "smart insights" feature that the previous
  revision's roadmap (Section 9, item 12) explicitly flagged as a low-impact,
  not-yet-built idea — it's now partially built.

**What changed under the hood (and is worth flagging as a regression):**
- The previous revision's `getMonthlyData(jobs)` local helper computed a
  `_sort` key (`year*12 + month`) specifically so months would render in
  **chronological** order rather than alphabetical or insertion order. The
  current `Analytics.jsx` builds `monthlyData` via a plain
  `Object.values(monthMap)` with **no sort at all** — bars on the "Applications
  by Month" chart now appear in whatever order months were first
  encountered while looping over `jobs` (effectively the order jobs happen to
  be stored in), not necessarily left-to-right chronological order. This is a
  real, user-visible regression from the previous implementation and worth
  fixing (Section 9).
- **A naming/duplication bug:** the KPI labeled **"Response Rate"** displays
  `successRate` from `getJobStats` — which is defined as `Offer / total`, the
  exact same ratio the separately-computed **"Offer Rate"** KPI directly
  below it also shows (`Math.round((totals.Offer / totals.total) * 100)`).
  Both cards currently show identical numbers under different labels. There
  is no card that actually shows what "response rate" conventionally means
  in this app's own domain language (i.e., `responded / total`, where
  `responded` = Interviewing + Offer + Rejected — the definition the
  *previous* revision of `Analytics.jsx` used before this rewrite). This
  looks like an unintentional regression introduced while wiring in the new
  KPI cards, not a deliberate design choice.

**Still true (not fixed):** `Analytics.jsx` still defines its own local
`KPI` component and its own local `colors` object rather than sharing either
with `Dashboard.jsx` — the duplication flagged previously is unchanged.

---

### 2.16 `src/components/Settings.jsx` — Preferences Page

Unchanged from the previous revision. Still a fully prop-driven, stateless
page; still only destructures `{ totals, successRate }`, unaffected by the
stats-engine expansion; still shares `exportJobsToCsv` with `Header.jsx`'s
own Export button (intentional redundancy, not a bug).

---

### 2.17 `src/components/Sidebar.jsx` — Left Navigation

Unchanged from the previous revision — data-driven `NAV` array, `activePage`/
`setActivePage` props, no local state. Note it does **not** show the logged-
in user's email or provide its own logout affordance — that lives solely in
`Header.jsx` now (Section 2.10). If a future redesign moves navigation
concerns around, keep in mind the Logout button currently has exactly one
entry point.

---

### 2.18 `src/components/StatusTimeline.jsx` — History Visualization

Unchanged from the previous revision — a pure, presentational vertical
stepper over a `history` prop, with a guard clause for empty/missing data and
a `STATUS_COLOR` fallback to the theme's primary color for unrecognized
statuses.

---

### 2.19 `src/utils/validation.jsx` — URL Validator

Unchanged from the previous revision — `validateAndNormalizeUrl(value)`
still validates, auto-prefixes `https://` when the user omits a protocol, and
rejects hostnames with no dot. Still misleadingly named with a `.jsx`
extension despite containing no JSX (Section 7).

---

### 2.20 `src/utils/stats.js` — Shared Statistics (substantially expanded)

**Purpose:** Still the one shared module that `Dashboard.jsx`, `Analytics.jsx`,
and `Settings.jsx` all call so status-counting logic can't drift out of sync
between pages — but it now does meaningfully more than counting.

**New helper functions (all module-private, not exported individually):**

- **`extractRoleType(title)`** — a keyword-matching classifier: lower-cases
  the job title and checks for substrings (`"frontend"`, `"backend"`,
  `"fullstack"`/`"full stack"`, `"devops"`, `"qa"`), falling back to
  `"Other"` if nothing matches. This is a simple, brittle heuristic — a title
  like `"Frontend/Backend Hybrid Engineer"` would match `"frontend"` first
  and never be considered `"Fullstack"` even though the substring "full
  stack" isn't present but the role clearly is; a title in a language other
  than English, or one that just says "Software Engineer" with no
  specialization keyword, always lands in `"Other"`.
- **`getResponseRate(jobs, roleType)`** — filters jobs down to one role type,
  then computes what fraction of *those* reached `Interviewing`, `Offer`, or
  `Rejected` (i.e., "got any reaction beyond silence," the same definition
  the old `Analytics.jsx` used for its overall response rate — see 2.15's
  note about that definition going missing at the top-level KPI).
- **`getInterviewConversionRate(jobs)`** — `Offer count / Interviewing count`
  — deliberately **not** `Offer / total`; this measures "once I get an
  interview, how often does it convert," a genuinely different and useful
  metric from the overall offer rate.
- **`getBestMonth(jobs)`** — buckets jobs by month (using
  `toLocaleDateString` with `{ month: "short", year: "2-digit" }`, e.g.
  `"Jun '26"`), computes each month's response rate the same way as
  `getResponseRate`, and returns the single month with the highest rate (ties
  go to whichever month was encountered first while iterating, since `>` is
  used rather than `>=`). Returns `null` if there are no jobs at all — this is
  exactly why `Analytics.jsx`'s "Best Month" KPI card is wrapped in
  `{bestMonth && (...)}`.

**`getJobStats(jobs)` (the exported default) now returns:**
```js
{ totals, successRate, responseByRole, interviewConversionRate, bestMonth }
```
— a superset of what it returned before (`totals`, `successRate` are
unchanged in meaning and calculation). This is why `Dashboard.jsx` and
`Settings.jsx` didn't need any changes to keep working: they simply don't
destructure the new fields.

**Business problem solved (the new part):** Previously, "how am I doing" was
purely aggregate (X% success rate overall). These additions start answering
*more specific* questions a job seeker actually cares about — "am I wasting
time applying to DevOps roles that never respond?", "once I land an
interview, how often do I actually get the offer?", "was there a month I
should repeat whatever I was doing differently?" — genuinely useful, portfolio
-worthy analytics, even though the role-classification heuristic (see above)
is simplistic.

---

### 2.21 `src/utils/exportCsv.js` — CSV Export

Unchanged from the previous revision, including the previously-flagged
correctness gap: values are wrapped in quotes (`"${v || ""}"`) but a literal
`"` character inside a note is never escaped (e.g., doubled to `""`), so a
note containing a quote character still produces a malformed CSV row. Not
fixed in this revision.

---

### 2.22 `src/index.css`, `src/styles/*.css`

Unchanged from the previous revision — CSS custom properties
(`--card-bg`, `--fg`, `--muted`, `--primary`, etc.) swapped via the
`[data-theme]` attribute set by `MainApp`'s theme-sync effect. No new
stylesheet was added for the auth pages (`SignupPage.jsx`/`LoginPage.jsx`),
which is why they're styled entirely with ad-hoc inline styles instead —
they simply never got wired into this system (Section 7).

---

### 2.23 Backend: `api/_lib/store.js`, `api/jobs/*.js`, `api/settings/[id].js` — Now Fully Legacy

**What these files do** is unchanged from the previous revision's detailed
walkthrough: a KV-or-in-memory storage abstraction (`store.js`), REST
handlers for job CRUD with server-side `statusHistory` management
(`api/jobs/index.js`, `api/jobs/[id].js`), and a settings/theme endpoint
(`api/settings/[id].js`).

**What changed is their status, not their code:** In the previous revision,
only `ThemeAPI`/`api/settings` were flagged as unused; `api/jobs/*` was
still the live, actually-called backend (via `src/api.js`'s `fetch()`
calls). **That is no longer true.** Since `src/api/api.js`'s `JobAPI` now
delegates entirely to `MockJobsAPI` (`localStorage`), **none** of the
`api/jobs/*` serverless functions are called by the running app anymore
either. The entire `api/` folder, `db.json`, and the `json-server`
dev-dependency are now fully vestigial from the frontend's point of view —
they'd only matter if someone deployed them and pointed a *different* client
at them directly.

**If a future developer wants to move off `localStorage`-only storage:**
this code is a legitimate, mostly-complete starting point — it already
correctly implements the append-only `statusHistory` business rule
server-side (something `MockJobsAPI` currently does *not* do, per Section
2.8), has a working KV/in-memory storage abstraction, and correct REST
semantics (404s, 405s, 201/204 status codes). Reconnecting `src/api/api.js`
to call these endpoints instead of `MockJobsAPI` would be a much smaller
lift than writing a real backend from scratch — see Section 9.

---

### 2.24 `db.json`, `package.json`, `vite.config.js`

- **`db.json`** — still the seed dataset for `json-server`, still only
  relevant if someone runs `npm run server`/`npm run api` and manually points
  a client at `http://localhost:3001` — the live app's Vite dev server proxy
  to `/api/*` (configured in `vite.config.js`) is never exercised anymore
  because nothing in `src/` issues a `fetch()` to `/api/jobs`.
- **`vite.config.js`** — unchanged; still proxies `/api/*` to
  `http://localhost:3001`, but that proxy now has no client-side caller.
- **`package.json`** — one new, notable dependency: **`firebase` (`^12.15.0`)
  is listed but never imported anywhere in `src/`.** This strongly suggests
  a real-auth migration (Firebase Auth replacing `MockAuthAPI`) was planned
  or started and then set aside in favor of finishing the mock first — the
  same "started the real thing, shipped the mock instead, forgot to remove
  the leftover" pattern that produced the still-dormant `api/` backend.
  `json-server` also remains as a devDependency, now only useful for anyone
  who wants to manually exercise the legacy `api/jobs/*` endpoints locally.

---

## 3. Data Flow Traces (User Action → Re-render)

### 3.0 Sign Up (NEW)

```
User lands on the app, not logged in → App.jsx: user is null → renders <SignupPage/>
User fills email/password, isSignup=true (toggled via the bottom link) → clicks "Sign Up"
 → SignupPage.handleSubmit → AuthContext.signup(email, password)
    → MockAuthAPI.signup(email, password)
       → initializeMockUsers() seeds the demo account if this is the very first run
       → rejects if email already exists in `mock_users`
       → builds { uid: crypto.randomUUID(), email, password, createdAt }, appends to `mock_users`
       → writes `current_user` = { uid, email } (password stripped)
    → AuthContext: setUser({ uid, email })
 → App.jsx re-renders: user is now truthy → SignupPage unmounts, <MainApp/> mounts
 → MainApp's load effect fires ([user] dependency) → JobAPI.list(user.uid)
    → MockJobsAPI.getJobs(user.uid) → localStorage key `user_jobs_<uid>` doesn't exist yet → []
 → user lands on an empty Dashboard, ready to add their first job
```

### 3.0b Log In (NEW)

```
User on SignupPage with isSignup=false → fills email/password → clicks "Login"
 → AuthContext.login(email, password) → MockAuthAPI.login(...)
    → looks up a user in `mock_users` matching BOTH email and password exactly
    → throws "Invalid email or password" if no match (shown inline via SignupPage's local `error` state)
    → on match: writes `current_user`, returns { uid, email }
 → AuthContext: setUser(...) → App.jsx swaps SignupPage for MainApp, same as signup above
    → MainApp fetches THIS user's jobs from `user_jobs_<uid>` — a returning user sees their own data back
```

### 3.0c Log Out (NEW)

```
User clicks "Logout" (Header.jsx, no confirmation dialog)
 → AuthContext.logout() → MockAuthAPI.logout() removes `current_user` from localStorage
    (does NOT touch `mock_users` or that user's `user_jobs_<uid>` data — nothing is deleted)
 → AuthContext: setUser(null)
 → App.jsx re-renders: user is null → MainApp unmounts entirely (all its in-memory state is discarded),
   SignupPage mounts in its place
 → Next login (same or different account) re-fetches from localStorage fresh — no data was lost,
   only the in-memory React state of the now-unmounted MainApp
```

### 3.1 Create Job

```
User clicks "Add Job" (Header) → Header: setOpen(true) → JobForm opens (jobToEdit = null → "create mode")
 → User fills fields → JobForm.handleChange updates local `form` state on every keystroke
 → User clicks "Save" → JobForm.handleSubmit
    → validateAndNormalizeUrl(form.link)
    → if valid: builds `job` object with a new crypto.randomUUID(), including an initial statusHistory entry
    → calls onCreate(job)  [prop chain: JobForm → Header → MainApp.handleCreateJob]
       → MainApp.handleCreateJob: await JobAPI.create(user.uid, job)
          → MockJobsAPI.createJob(user.uid, job): assigns an id if missing, unshifts into
            localStorage key `user_jobs_<uid>`, saves, returns the stored record
       → setJobs(prev => [created, ...prev])
    → React re-renders MainApp and all children that read `jobs` (Dashboard/Analytics/Settings/JobList/KanbanBoard)
 → JobForm closes, form resets to blank defaults
```
**Delta from the previous revision:** no network round-trip occurs at all now
— every step above happens synchronously in the same browser tab. There is
also no server-side reconciliation step anymore (Section 2.11) — whatever
`JobForm` builds client-side is exactly what gets persisted, with no backend
double-check.

### 3.2 Edit Job

Same sequence as the previous revision (row select → Edit button →
`isEditing`/`editingJob` → modal opens pre-filled → status-change-date field
appears conditionally → Save), except the final persistence step is now:
```
onUpdate(jobToEdit.id, partial) → MainApp.handleUpdateJob(id, partial)
  → await JobAPI.update(user.uid, id, partial) → MockJobsAPI.updateJob(...): plain object merge, no
    server-side statusHistory enforcement (Section 2.8) → saves to `user_jobs_<uid>`, returns the record
  → setJobs(prev => prev.map(j => j.id === id ? updated : j))
  → onCancelEdit()
```

### 3.3 Delete Job

Same sequence as before, with `JobAPI.remove(user.uid, id)` →
`MockJobsAPI.deleteJob(user.uid, id)` filtering the job out of that user's
localStorage array and saving — no network call, no `204` response to wait
on (the "await" resolves essentially instantly).

### 3.4 Select Job

Unchanged — purely client-side UI state, no persistence layer involved at
all (same before and after the auth/backend changes).

### 3.5 Change Status (via Edit form OR Kanban drag)

Same two-entry-points-one-function shape as before (`JobForm`'s submit and
`KanbanBoard`'s `onDragEnd` both call `handleUpdateJob`), but **the
"authoritative statusDate defaulting" that used to live in
`api/jobs/[id].js`'s `PATCH` handler no longer runs**, because that endpoint
is no longer called (Section 2.23). Whatever date each caller constructs
client-side is now final — there's no backend safety net silently defaulting
a missing `statusDate` to "today" anymore; if a future code path forgets to
set one, it simply won't be there.

### 3.6 Kanban Drag & Drop (full mechanics)

Unchanged mechanically from the previous revision (`@hello-pangea/dnd`
handles the gesture; `onDragEnd` translates a completed drop into
`onUpdate(jobId, { status: newStatus })`); only the underlying persistence
call has changed, per 3.5 above.

### 3.7 Theme Toggle

Unchanged — still `localStorage`-only, still synced via a `useEffect` on
`mode` that sets `document.documentElement[data-theme]`, still rebuilt via a
`useMemo`-cached `createAppTheme(mode)`. Not affected by the auth changes.

### 3.8 Search / 3.9 Filter (by status)

Unchanged from the previous revision — the state and the `filtered`
computation both still exist in `MainApp`, and there is still no visible
input/dropdown wired to `setQuery`/`setStatusFilter` anywhere in the current
JSX. Still an open item (Section 9).

### 3.10 Analytics Calculations (expanded)

```
MainApp holds the full `jobs` array (unfiltered) → passed as a prop to <Analytics jobs={jobs} />
 → Analytics calls getJobStats(jobs) [shared util, now expanded — see 2.20]
   → { totals, successRate, responseByRole, interviewConversionRate, bestMonth }
 → Analytics also still builds its own local monthlyData by looping over jobs directly
   (no longer chronologically sorted — see 2.15's regression note)
 → Recharts components consume these derived arrays/objects and draw the bar/pie charts;
   the new "Response Rate by Role" panel just maps Object.entries(responseByRole) into plain divs,
   no charting library involved
```

---

## 4. Architecture Review

```
                    ┌───────────────┐
                    │  AuthProvider │  ← STATE OWNER for: user, auth loading/error
                    │ (main.jsx)    │     (wraps everything below)
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │    App.jsx    │  ← GATE: user ? <MainApp/> : <SignupPage/>
                    └───────┬───────┘
              ┌─────────────┴─────────────┐
              ▼                           ▼
        <SignupPage/>                 <MainApp/>  ← STATE OWNER for: jobs, activePage,
     (email/password,                     │           selectedJobId, isEditing/editingJob,
      isSignup toggle)                    │           query/statusFilter/sortBy/view, mode
                                           │
        ┌──────────┬──────────┬───────────┼───────────┬────────────┐
        ▼          ▼          ▼           ▼            ▼            
   Sidebar      Header     Dashboard   Analytics    Settings
  (activePage  (jobs,       (jobs)      (jobs)      (mode, jobs)
   nav only)    selection,
                edit state,
                theme,
                logout)
                  │
            ┌─────┴─────┐
            ▼           ▼
        JobForm   (delete confirm Dialog, inline)
            │
            ▼
      StatusTimeline

   Applications page (conditionally one of):
        JobList  (jobs=filtered, selectedJobId, onSelect)
        KanbanBoard (jobs=filtered, onUpdate)
```

- **New top-level state owner:** `AuthProvider`/`AuthContext` — the first
  and only Context in this codebase, sitting *above* the `App` gate rather
  than being lifted state inside a component, precisely because the gate
  itself needs to read it.
- **`App.jsx`'s role changed:** it's no longer the state owner described in
  the previous revision — it's now a thin gate, with `MainApp` (an internal,
  unexported component in the same file) taking over that role.
- Everything below `MainApp` is structurally identical to the previous
  revision's diagram — no new prop-drilling was introduced by the auth work,
  since `Header.jsx` reads `logout` directly from `AuthContext` via
  `useContext` rather than receiving it as a prop from `MainApp`.
- **Prop drilling vs. Context — a live comparison now visible in this
  codebase:** `onCreate`/`onUpdate` still travel `MainApp → Header → JobForm`
  as props (2 levels — genuine prop drilling), while `logout` travels via
  `useContext(AuthContext)` directly inside `Header`, skipping `MainApp`
  entirely. This is a good, concrete illustration of *when* Context earns its
  complexity: `user`/`logout` are needed by components that aren't in a
  direct line from a single common data-owner in the way `jobs` is, so
  Context was the right call here, whereas `jobs` genuinely only has one
  natural owner (`MainApp`) and doesn't need it.

---

## 5. React Concepts Used (Glossary, Grounded in This Codebase)

All concepts from the previous revision still apply unchanged (see
`useState`, `useEffect`, `useMemo`, controlled components, lifting state up,
conditional rendering, derived state, prop drilling, component composition).
One concept is newly exercised by this revision:

- **React Context (`createContext`/`useContext`/`Provider`)** — introduced
  for the first time via `AuthContext.jsx`. `createContext()` creates a
  "channel"; `AuthProvider` is the component that actually puts a value onto
  that channel (`user`, `loading`, `error`, `signup`, `login`, `logout`);
  any descendant component can call `useContext(AuthContext)` to read that
  value without it being passed down as a prop through every intermediate
  component. Contrast with prop drilling (still used for `onCreate`/
  `onUpdate` → `JobForm`): Context is the right tool specifically when many
  *unrelated* components at different depths all need the same value (here:
  `App.jsx` for gating, `Header.jsx` for the logout button) — using it for
  `jobs` (which really only has one consumer tree rooted at `MainApp`) would
  be over-engineering.
- **Component splitting to satisfy the Rules of Hooks** — `App`/`MainApp`
  (Section 2.2) is a concrete, real example of why you sometimes can't just
  add an early `return` before your hooks inside one function; splitting
  into an outer gate and an inner hook-owning component is the standard fix.

---

## 6. Business Features — How They Work Internally

- **Authentication & Per-User Data (NEW)** — `MockAuthAPI` (email+password,
  plaintext, `localStorage`) issues a `uid`; every job read/write is scoped
  by that `uid` via `MockJobsAPI`'s `user_jobs_<uid>` key convention. This is
  a real multi-tenancy model, just backed by the browser instead of a
  server — swapping in real backend auth later would mean replacing
  `MockAuthAPI`'s internals while keeping its four-method shape
  (`signup`/`login`/`getCurrentUser`/`logout`) intact, similar to how
  `JobAPI`'s shape survived its own backend swap (Section 2.6).
- **Job CRUD** — Same shape as before, but the "source of truth" is now
  `localStorage` via `MockJobsAPI` rather than a real server; the frontend
  no longer defers to a server-returned canonical copy for anything beyond
  ID assignment.
- **Status Timeline** — Same display component (`StatusTimeline.jsx`), but
  the responsibility for *building* `statusHistory` correctly has moved
  entirely to the frontend (`JobForm.jsx`, `KanbanBoard.jsx`) now that the
  backend that used to own this rule is dormant (Section 2.8/2.23).
- **Follow-up Reminder System** — Unchanged; still lives entirely in
  `JobList.jsx`, still a computed-at-render visual badge, not a real
  notification.
- **Analytics** — Two flavors as before (`Dashboard.jsx` snapshot,
  `Analytics.jsx` trends), but `Analytics.jsx` now additionally surfaces
  role-based response rates, interview-to-offer conversion, and a
  best-performing month — a real step toward the "smart insights" idea the
  previous roadmap only speculated about (Section 9 revisits this).
- **Search / Filtering / Sorting** — Unchanged, still unreachable via any
  visible UI control (Section 3.8/3.9).
- **Theme Persistence** — Unchanged, `localStorage`-only; `ThemeAPI`/
  `api/settings` remain unused (now doubly so, since the endpoint it would
  hit is no longer served by anything the app calls).
- **Kanban Board & Drag-and-Drop Status Changes** — Unchanged mechanically;
  filename bug fixed (Section 2.13).

---

## 7. Engineering Assessment

**Strengths**
- Clear, consistent state-ownership model preserved through the auth
  refactor — `MainApp` still correctly owns cross-cutting state; the new
  `App`/`MainApp` split is a textbook-correct response to a real Rules-of-
  Hooks constraint, not an accident.
- The `JobAPI` facade (Section 2.6) proved its value in practice: the entire
  storage backend was swapped from real HTTP calls to `localStorage` without
  a single change needed in any component that calls `JobAPI` — this is
  exactly the payoff the adapter pattern promises, actually realized here,
  not just theoretical.
- Real, working multi-user data isolation (`user_jobs_<uid>`), implemented
  without being asked to scale to "real" multi-tenancy — a sign of thinking
  about data ownership correctly even in a mock.
- The `kanbanBoard.jsx`/`KanbanBoard.jsx` casing bug flagged in the previous
  review has actually been fixed — concrete evidence that previous feedback
  (or independent code review) gets acted on.
- The analytics expansion (`stats.js`) adds genuinely useful, non-trivial
  derived metrics (interview conversion, best month, per-role response rate)
  without touching the two consumers (`Dashboard.jsx`, `Settings.jsx`) that
  didn't need the new fields — an example of extending a shared function
  additively rather than breaking its existing contract.

**Weaknesses**
- **Mock auth stores plaintext passwords in `localStorage`.** Explicitly
  self-flagged in a code comment (`// In real app, this would be hashed!`),
  so this is a known, deliberate shortcut rather than an oversight — but it's
  worth being able to explain clearly why it's disqualifying for any real
  deployment (no hashing/salting, no rate limiting, `localStorage` readable
  by any script on the page).
- **`LoginPage.jsx` is dead code.** It's a fully-built, never-imported
  component; `SignupPage.jsx` independently implements the same login flow
  internally via a toggle. Should be deleted, or the app should be refactored
  to actually route to it.
- **The entire top-level `api/` backend, plus `db.json` and the
  `json-server` devDependency, are now fully dormant** — not partially, as
  in the previous revision (which still had a live `api/jobs/*`). Nothing in
  `src/` calls any of it anymore. This is a bigger version of the same
  "evolved past it, never deleted it" pattern flagged before — now covering
  an entire backend, not just one endpoint.
- **An unused `firebase` dependency sits in `package.json`.** Never imported
  anywhere. Strongly suggestive of an abandoned real-auth migration attempt,
  another instance of the same pattern.
- **Analytics.jsx's monthly chart lost its chronological sort** in the
  rewrite that added the new KPI cards (Section 2.15) — bars can now render
  out of calendar order. This reads as an accidental regression, not a
  deliberate change.
- **A real, user-visible metric bug:** Analytics' "Response Rate" and "Offer
  Rate" KPI cards currently show the *same number* under two different
  labels (Section 2.15), while the app's own `getResponseRate`/
  `responseByRole` logic elsewhere clearly treats "response rate" as a
  different, broader calculation (`responded / total`, where responded
  includes Rejected). This should be fixed — either card should be corrected
  or renamed.
- **Search/Filter UI is still wired in state but not in the visible JSX** —
  unchanged from the previous revision; still worth finishing or removing.
- **No server-side validation exists anywhere anymore** (there's no server),
  and there's also no client-side "sanity" layer beyond `JobForm`'s HTML
  `required` attributes — since `MockJobsAPI` does a bare object merge with
  no shape-checking, any code path that calls `JobAPI.create`/`update`
  directly (bypassing `JobForm`) could write malformed records with nothing
  to stop it.
- **Logout has no confirmation**, unlike Delete — an accidental click
  instantly discards the current in-memory UI state (open modals, unsaved
  filter selections) with no warning, even though no actual data is lost.
- **Styling inconsistency widened, not narrowed:** the new auth pages
  (`SignupPage.jsx`, `LoginPage.jsx`) and the new Logout button
  (`Header.jsx`) are all inline-styled, adding to the pre-existing
  inconsistency around `KanbanBoard.jsx`'s inline styles versus every other
  component's `.css` file convention.
- **Carried over, still true:** duplicated `COLORS`/`KPI` definitions across
  `Dashboard.jsx`/`Analytics.jsx`/`KanbanBoard.jsx`; `.jsx` extension on the
  non-JSX `validation.jsx`; CSV export's unescaped-quote bug; blocking
  native `alert()` in `exportCsv.js`.

**Scalability concerns**

Largely unchanged from the previous revision, but now entirely a
browser-storage concern rather than a server one: `MockJobsAPI.saveJobs`
rewrites a user's *entire* job array to `localStorage` on every single
mutation (write-amplification, same shape of problem the old in-memory
backend had, just relocated), and `localStorage` itself has a hard per-origin
size ceiling (typically ~5–10MB depending on browser) that a very active
user could theoretically approach given enough jobs, notes, and status
history over years of use — something a real backend would never risk.

**Code quality / maintainability review**

The core pattern from the previous revision holds: generally readable,
sensibly named, mostly self-explanatory, with comments appearing exactly
where the reasoning is genuinely non-obvious (`mockAuth.js`'s
plaintext-password comment is a good example of this). The auth/analytics
additions are consistent with the same "moving fast on feature work without
a final consolidation pass" pattern already identified — evidenced concretely
by two now-orphaned subsystems (`LoginPage.jsx`, the entire `api/` backend)
and one unused dependency (`firebase`) accumulating in a single revision's
worth of changes.

**UI/UX review**

The stale-application badge and the new role/time-based analytics insights
continue to be genuinely thoughtful, real-world-useful features. The new
weak spots are the unstyled auth screens (visually jarring compared to the
polished MUI-based rest of the app) and the two Analytics KPI cards silently
showing duplicate numbers under different names — a user comparing "Response
Rate" against "Offer Rate" would reasonably expect two different numbers and
might draw a wrong conclusion from seeing them match.

**Architecture review**

Still sound for the app's size, and the auth addition was integrated cleanly
via the correct tool (Context) without disturbing the existing state-
ownership model. The most important architectural fact to carry forward is
that **this app currently has zero server dependency at runtime** — it is a
fully client-side, `localStorage`-backed SPA wearing the API-shaped
interfaces of a real client/server app. That's a deliberate and reasonable
choice for a personal, single-browser tool and for a portfolio demo, but it
means "your data" is really "this browser profile's data" — clearing browser
storage, or opening the app in a different browser/device, means starting
over with no jobs and no accounts, since none of it lives anywhere but that
one browser.

---

## 8. Skill Assessment

Based on this codebase, the developer continues to demonstrate skills
consistent with **Strong Junior, trending toward Mid-Level**, with this
revision adding evidence on both sides of that assessment.

**New evidence supporting the "trending mid-level" read:**
- Correctly reached for React Context specifically when prop drilling
  stopped being the right tool (`user`/`logout` needed by components with no
  direct parent/child relationship), rather than either over-using Context
  everywhere or forcing everything through props regardless of fit.
- Recognized and correctly solved a real Rules-of-Hooks constraint by
  splitting `App`/`MainApp` — many developers at this level would instead
  reach for a hacky early-return-before-hooks pattern that works until it
  doesn't (e.g., the moment a second piece of state needs a hook above the
  gate).
- Kept the `JobAPI` facade's public shape stable while completely swapping
  its implementation (real HTTP → `localStorage`) — demonstrates
  understanding *why* that abstraction layer existed in the first place, not
  just that it happened to be there.
- Extended `getJobStats` additively (new return fields, no breaking changes
  to existing consumers) rather than rewriting it in a way that would have
  forced updates to `Dashboard.jsx` and `Settings.jsx` too.
- Self-documented a known security shortcut in code (`mockAuth.js`'s
  plaintext-password comment) rather than leaving it silently wrong — shows
  awareness of the gap even without fixing it yet.

**Evidence still consistent with "not yet senior":**
- The pattern of abandoning a subsystem mid-migration without deleting it
  repeated at least twice in this revision alone (`LoginPage.jsx`, the
  unused `firebase` dependency) on top of the pre-existing dormant `api/`
  backend — a senior engineer in code review would likely have caught and
  removed at least one of these before merging.
- The Analytics "Response Rate"/"Offer Rate" duplicate-number bug (Section
  7) suggests the new KPI cards were added without checking the resulting
  UI against the existing cards for redundancy — a quick manual QA pass
  comparing the two numbers side by side would have caught this immediately.
- The lost chronological sort in the monthly chart is the kind of thing that
  slips through when a rewrite focuses on adding a new feature and doesn't
  re-verify behavior the previous version of the same function used to
  guarantee.

---

## 9. Improvement Roadmap

**High Impact**
1. **Fix the Analytics "Response Rate" / "Offer Rate" duplicate-metric bug**
   (Section 7) — decide what each card is actually supposed to show
   (`responded/total` vs `Offer/total`) and make sure they show different,
   correctly-labeled numbers.
2. **Restore chronological ordering to the "Applications by Month" chart** in
   `Analytics.jsx` — reintroduce a sort key (e.g., the previous `_sort =
   year*12 + month` trick) before rendering `monthlyData`.
3. **Decide the fate of the dormant `api/` backend, `db.json`, and
   `json-server`.** Either (a) delete them, since the app is now fully
   `localStorage`-based and they add pure cognitive overhead with zero
   runtime benefit, or (b) deliberately resurrect them as the real
   persistence layer (pointing `src/api/api.js`'s `JobAPI` at real `fetch()`
   calls again) if moving beyond single-browser storage is actually a goal —
   the backend already correctly implements the `statusHistory` business
   rule server-side, which would be a real win to get back (Section 2.8).
4. **Replace mock auth with real auth** before this could ever be used by
   more than one person on a trusted device — the already-installed but
   unused `firebase` dependency suggests this was already being considered;
   Firebase Auth (or any real hashed-password/OAuth provider) would remove
   the plaintext-password problem entirely and pair naturally with
   resurrecting the real backend from item 3.
5. **Delete `src/pages/LoginPage.jsx`** (or actually wire it up via a router)
   — it's dead code that will confuse the next person who edits it expecting
   an effect.

**Medium Impact**
6. **Wire up (or remove) Search and Status Filter UI** — unchanged from the
   previous revision's recommendation; still not done.
7. **Deduplicate status colors/KPI components** into a shared
   `constants/statusColors.js` and a shared `<KPI/>` — unchanged
   recommendation, now spanning three independent copies (`Dashboard.jsx`,
   `Analytics.jsx`, `KanbanBoard.jsx`).
8. **Add a confirmation step to Logout**, matching the existing Delete
   confirmation pattern, so an accidental click doesn't discard in-progress
   UI state with no warning.
9. **Testing** — still zero automated tests anywhere. `utils/stats.js` is
   now a much stronger first candidate than before, given the new
   `extractRoleType`/`getResponseRate`/`getBestMonth` logic has several edge
   cases (empty jobs array, unparseable dates, tie-breaking in "best month")
   that are exactly the kind of thing unit tests catch cheaply.
10. **React Router** — same recommendation as before; would also let
    `LoginPage.jsx` (item 5) become a real, separately-linkable route instead
    of dead code or a toggle.

**Low Impact**
11. **Style the auth pages consistently** with the rest of the app's CSS-
    variable-based theming, instead of the current ad-hoc inline styles that
    don't respond to dark/light mode the way the rest of the UI does.
12. **TypeScript** — unchanged recommendation from the previous revision.
13. **File attachments**, **Smart insights** — the "smart insights" item
    from the previous revision's roadmap is now partially realized
    (role-based response rate, best month, interview conversion); remaining
    low-impact ideas in this space (e.g., "best day of week to apply") are
    still gated on having enough real data volume to be meaningful.
14. **Activity feed / Notifications** — unchanged recommendations from the
    previous revision; both remain natural extensions of the existing
    `statusHistory` data model.
