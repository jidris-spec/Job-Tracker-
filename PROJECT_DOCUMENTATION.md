# Job Tracker — Complete Engineering Documentation

> Written for a developer joining the team who is still learning React.
> Every section explains things in plain English first, then in technical terms.

---

## 0. The Big Picture (read this first)

Think of this app like a personal CRM for your job hunt. Instead of tracking customers, you track job applications: who you applied to, what stage you're at (Applied → Interviewing → Offer/Rejected), and notes about each one.

It has two halves:

1. **Frontend** (`src/`) — a React single-page app. This is "the building" — what the user sees and clicks.
2. **Backend** (`api/`) — tiny serverless functions that store the data. This is "the filing cabinet" — where job records actually live.

In local development, the filing cabinet is actually `json-server` reading from `db.json` (a fake REST API for prototyping). In production (Vercel), the filing cabinet becomes real serverless functions in `api/`, backed by Vercel KV (a cloud key-value store) or, if that's not configured, plain server memory (which resets every time the server restarts — more on this danger later).

---

## 1. Project Structure (Complete File Tree)

```
Job-Tracker-/
├── package.json                  # Project metadata, scripts, dependencies
├── vite.config.js                # Build tool config + local API proxy
├── eslint.config.js              # Linting rules
├── db.json                       # Fake database file for json-server (local dev only)
│
├── api/                          # Backend — Vercel serverless functions
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
    ├── main.jsx                  # React entry point — boots the app into the DOM
    ├── App.jsx                   # Root component — owns all global state
    ├── api.js                    # Fetch wrapper — talks to the backend
    ├── theme.js                  # MUI theme factory (light/dark palettes)
    ├── index.css                 # Global resets
    │
    ├── components/
    │   ├── Header.jsx             # Top bar: page title, Add/Edit/Delete/Export/Theme buttons
    │   ├── JobForm.jsx            # Modal dialog: create & edit job form
    │   ├── JobList.jsx            # Table view of all jobs ("Applications" page)
    │   ├── kanbanBoard.jsx        # Drag-and-drop board view (Kanban) — note lowercase filename
    │   ├── Dashboard.jsx          # "Dashboard" page — KPIs + recent activity + donut chart
    │   ├── Analytics.jsx          # "Analytics" page — monthly bar chart + breakdown pie chart
    │   ├── Settings.jsx           # "Settings" page — theme toggle + CSV export + summary stats
    │   ├── Sidebar.jsx            # Left navigation rail
    │   └── StatusTimeline.jsx     # Vertical timeline showing a job's status history
    │
    ├── utils/
    │   ├── validation.jsx         # URL validation/normalization (despite .jsx extension, no JSX inside)
    │   ├── stats.js               # Pure function: jobs[] -> totals + success rate
    │   └── exportCsv.js           # Converts jobs[] into a downloadable CSV file
    │
    └── styles/
        ├── App.css, Header.css, Dashboard.css, JobList.css, Job.css,
        └── Settings.css, Sidebar.css      # Plain CSS, one file per component family
```

**Analogy:** `src/` is the showroom floor of a car dealership (what customers interact with), `api/` is the warehouse and inventory system in the back (where the actual cars/data are kept), and `db.json` is a cardboard box standing in for the warehouse while you're still building it.

---

## 2. File-by-File Documentation

### 2.1 `src/main.jsx` — The Entry Point

**Purpose:** This is the very first JavaScript that runs. Its only job is to find the `<div id="root">` in `index.html` and tell React "render the `<App />` component inside this DOM node." Every React app needs exactly one of these.

**Why it exists:** React doesn't automatically know where on the page it should draw itself. This file is the bridge between plain HTML and the React world.

**Imports:**
- `React` — needed historically for JSX to work; with the modern JSX transform it's less strictly required, but `React.StrictMode` below needs the `React` namespace.
- `ReactDOM` from `react-dom/client` — the modern (React 18) client rendering API. `createRoot` enables concurrent features. Without it, you could not mount a React tree onto the DOM at all — nothing would ever appear.
- `App` — the root component (see below).
- `./index.css` — global stylesheet, imported here so Vite bundles it into the page.

**What `React.StrictMode` does:** A wrapper that doesn't render any visible UI. It runs extra development-only checks (e.g., double-invoking some functions) to help you catch bugs like impure render functions. If removed, the app behaves identically in production but loses some dev-time safety nets.

**If this file were removed:** Nothing would ever render — you'd see a blank white page, because nothing tells React where to attach.

---

### 2.2 `src/App.jsx` — The Root / "Brain" Component

**Purpose:** This is the central nervous system of the app. It owns *all* state that needs to be shared across pages: the list of jobs, which page is active, search/filter/sort settings, the currently selected job, edit mode, and the color theme. Every page (Dashboard, Applications, Analytics, Settings) is a child that receives data and callbacks from `App`.

**Why it exists / problem it solves:** Without a single "owner" of shared state, every component would need its own copy of the jobs list, leading to inconsistent UI (e.g., deleting a job in one view but it still shows in another). This is the **"lifting state up"** pattern — when multiple components need the same data, you move that data to their closest common parent.

**Imports explained:**
| Import | Why needed | If removed |
|---|---|---|
| `React, { useEffect, useMemo, useState }` | Hooks for state, side effects, memoized derived values | App couldn't hold state or react to changes — would crash on use of `useState` etc. |
| `./styles/App.css` | Page-wide layout styles (`.layout`, `.main-content`, `.page`) | Layout would collapse, no spacing/structure |
| `ThemeProvider, CssBaseline` from `@mui/material` | `ThemeProvider` injects the MUI theme object into every nested MUI component (via React Context). `CssBaseline` resets browser default styles (margins, font smoothing) consistently. | MUI components would fall back to default blue theme; inconsistent baseline styling across browsers |
| `createAppTheme` from `./theme.js` | Builds the actual MUI theme object based on light/dark mode | No themed colors; everything reverts to MUI's defaults |
| `KanbanBoard, Header, JobList, Dashboard, Analytics, Settings, Sidebar` | The child components rendered conditionally per page | App would have nothing to render — blank page |
| `SearchIcon` from `@mui/icons-material/Search` | **Unused import** — not referenced anywhere in this file | Currently dead code; removing it does nothing but a smaller bundle |
| `JobAPI` from `./api.js` | The object used to fetch/create/update/delete jobs from the backend | App couldn't load or persist any data — jobs list would always be empty |

**State Analysis (every `useState`):**

| State | Stores | Why needed | Who updates it | Who depends on it |
|---|---|---|---|---|
| `jobs` | Array of job objects | The single source of truth for all job data | `handleCreateJob`, `handleUpdateJob`, `handleDeleteJob`, and the initial load effect | Dashboard, Analytics, Settings, JobList (via `filtered`), KanbanBoard, Header (for export) |
| `loading` | Boolean | Tracks whether the initial API fetch is still in flight, to show a loading message | The load effect (`setLoading(true)` then `false`) | The render logic (`{loading && ...}`) |
| `error` | String | Holds an error message if the fetch fails | The load effect's `catch` block | The render logic (`{error && ...}`) |
| `activePage` | String (`"dashboard"`, `"applications"`, `"analytics"`, `"settings"`) | Determines which "page" is currently shown — this app has no router, so this state variable *is* the router | `Sidebar` (via `setActivePage`) | `Header` (page title), the big conditional render block |
| `selectedJobId` | String or `null` | Tracks which row in the table is currently selected/highlighted, so Edit/Delete know which job to act on | `JobList` (via `onSelect`), reset to `null` in `handleDeleteJob` if the deleted job was selected | `Header` (`canEdit`, `canDelete`), `JobList` (`selectedJobId` prop for highlighting) |
| `isEditing` | Boolean | Whether the Add/Edit modal is currently in "edit an existing job" mode vs "create new" mode | `Header`'s `onEdit` handler sets it true; `onCancelEdit` sets it false | `Header` (disables Add button while editing), `JobForm` (via `jobToEdit`) |
| `editingJob` | Job object or `null` | Holds a copy of the job being edited so the form can be pre-filled | Set by `onEdit` in `Header`'s props (look up by `selectedJobId`), cleared by `onCancelEdit` | `Header` passes it to `JobForm` as `jobToEdit` |
| `query` | String | The current search box text | (Search input isn't shown in current JSX — likely controlled elsewhere or a leftover; see Weaknesses) | The `filtered` derived list |
| `statusFilter` | String (`"All"`, `"Applied"`, etc.) | Which status the Applications table is filtered to | Not currently wired to any visible UI control in `App.jsx` (see Weaknesses) | The `filtered` derived list |
| `sortBy` | String (`"newest"`/`"oldest"`) | Sort order for the table | Not currently wired to a UI control either | The `filtered` derived list |
| `view` | String (`"table"`/`"board"`) | Whether the Applications page shows the table or the Kanban board | The Table/Board toggle buttons inline in JSX | Conditional render of `JobList` vs `KanbanBoard` |
| `mode` | String (`"light"`/`"dark"`) | The current color theme, initialized from `localStorage` | `toggleTheme()` | `useEffect` (sets `data-theme` attribute), `muiTheme` memo, `Header`, `Settings` |

> **Note for the interview:** `query`, `statusFilter`, and `sortBy` exist and are used in the `filtered` computation, but there's no visible search box or filter dropdown wired to them in the current `App.jsx` JSX. This is a real, callable-out weakness — see Engineering Assessment.

**Effect Analysis (every `useEffect`):**

1. **Theme-sync effect**
   ```js
   useEffect(() => {
     document.documentElement.setAttribute("data-theme", mode);
   }, [mode]);
   ```
   - **When it runs:** On first render, and again any time `mode` changes.
   - **Why:** The CSS files use `[data-theme="dark"]` / `[data-theme="light"]` selectors (typical CSS custom-property theming approach) to flip color variables. This effect is the bridge between React state and that plain CSS mechanism.
   - **Side effect:** Mutates the real DOM directly (`document.documentElement`), which is *outside* React's normal render output — exactly the kind of thing `useEffect` exists for.
   - **Trigger:** `[mode]` dependency array — re-runs only when the theme changes, not on every render.

2. **Initial data-load effect**
   ```js
   useEffect(() => {
     (async () => {
       try {
         setLoading(true);
         const data = await JobAPI.list();
         setJobs(data);
       } catch (e) {
         setError(e.message || "Failed to load");
       } finally {
         setLoading(false);
       }
     })();
   }, []);
   ```
   - **When it runs:** Exactly once, immediately after the component mounts (empty dependency array `[]`).
   - **Why:** React components can't directly `await` inside their body — you can't make the render function itself asynchronous. So the standard pattern is: define an async IIFE (Immediately Invoked Function Expression) inside the effect and call it.
   - **Side effects:** Network request to the backend; three state updates (`loading`, `jobs` or `error`).
   - **Business problem solved:** On page load, the user should see their previously saved jobs, not an empty list. This effect is the "go fetch my data" step.

**Function Analysis:**

- **`handleCreateJob(job)`**
  - Input: a new job object (built by `JobForm`).
  - Calls `JobAPI.create(job)` → sends a POST request, awaits the server's response (the server may enrich the object, e.g., add `statusHistory`).
  - Output/side effect: prepends the *server-returned* job (not the local one) to `jobs` via `setJobs((prev) => [created, ...prev])`. Using the server's version, not the client's, matters because the server might add fields like `statusHistory`.
  - Business problem: Persisting a new application and reflecting it immediately in the UI without refetching the whole list.

- **`handleUpdateJob(id, partial)`**
  - Input: job `id` and a partial object of fields to change (e.g., `{ status: "Offer" }`).
  - Calls `JobAPI.update(id, partial)` (PATCH request), awaits the updated job from the server.
  - Side effect: replaces the matching job in `jobs` with the server's updated version via `.map`.
  - Business problem: Both the "Edit Job" form *and* the Kanban drag-and-drop status changes funnel through this one function — it's the single front door for "change something about a job."

- **`handleDeleteJob(id)`**
  - Calls `JobAPI.remove(id)` (DELETE request).
  - Side effect: removes the job from local `jobs` via `.filter`; if the deleted job was the selected one, clears `selectedJobId` so the UI doesn't point at a ghost row.
  - Business problem: Permanently removing an application a user no longer wants to track, while keeping `selectedJobId` consistent (avoiding a dangling reference bug).

- **`onCancelEdit()`** — resets `isEditing` and `editingJob` to their "off" states. Used when the user closes the modal without saving.

- **`filtered` (derived, not a `useState`)**
  - A plain expression recomputed on every render (no `useMemo`): filters `jobs` by `query` matching company or title (case-insensitive substring), then by `statusFilter`, then sorts by `date`.
  - This is **derived state** — it's not stored separately; it's computed fresh from `jobs`, `query`, `statusFilter`, `sortBy` every render. That's the correct React pattern (don't duplicate state that can be computed).

- **`toggleTheme()`** — flips `mode` between `"light"`/`"dark"`, persists the new value to `localStorage` so it survives a page refresh.

- **`muiTheme = useMemo(() => createAppTheme(mode), [mode])`**
  - `useMemo` caches the *expensive* theme-object creation so it's only recomputed when `mode` actually changes, not on every re-render of `App` (which happens often, e.g., every time `jobs` changes). Without it, every state update anywhere in `App` would rebuild the entire MUI theme object — wasteful but not catastrophic at this scale.

**Component composition / JSX structure:**
```
ThemeProvider
 └─ CssBaseline
 └─ div.layout
     ├─ Sidebar
     └─ div.main-content
         ├─ Header
         └─ div.page
             ├─ loading / error messages
             └─ (conditional) Dashboard | Applications(JobList|KanbanBoard) | Analytics | Settings
```

**What App.jsx should own / should NOT own:**
- ✅ Should own: jobs data, navigation state, selection state, theme state — anything more than one page needs.
- ❌ Should *not* own: form-field-level state (that belongs in `JobForm`), per-row UI state like hover effects (belongs in `JobList`/`KanbanBoard`).

---

### 2.3 `src/api.js` — The Network Layer

**Purpose:** Centralizes every `fetch()` call to the backend. Instead of every component knowing the URL shape and HTTP verbs, they just call `JobAPI.create(job)` etc.

**Why it exists:** If the API base URL or request shape changes, you change it in one place, not in every component. This is the **single responsibility** / **separation of concerns** principle — UI components shouldn't need to know about HTTP.

```js
const API_BASE = import.meta.env.VITE_API_BASE || "/api";
```
- `import.meta.env` is Vite's way of exposing environment variables to the browser at build time. `VITE_API_BASE` lets you point at a different backend URL in different deployments; falling back to `/api` means "use whatever this app is hosted on" (works with the Vite dev proxy or Vercel's same-origin functions).

**`JobAPI` object — methods:**
- `list()` — GET `/api/jobs`. Throws if `!r.ok` (any non-2xx status), otherwise resolves to the parsed JSON array.
- `create(job)` — POST with JSON body, throws on failure, returns the created job from the server.
- `update(id, partial)` — PATCH with a partial object — only the fields that changed.
- `remove(id)` — DELETE; returns `true` rather than parsing a body (DELETE here responds 204 No Content).

**`ThemeAPI`** — exists but is **never imported/used** anywhere in the current `src/` code (theme is persisted via `localStorage` instead, in `App.jsx`). This is dead/unused code — likely a remnant of an earlier approach to syncing theme through the backend, before `localStorage` was adopted. Worth flagging in code review.

**If `api.js` were removed:** No component could talk to the backend at all; `App.jsx`'s data-load effect would throw `JobAPI is not defined`.

---

### 2.4 `src/theme.js` — MUI Theme Factory

**Purpose:** A pure function `createAppTheme(mode)` that returns a complete MUI theme object — colors, typography, and default component style overrides — for either light or dark mode.

**Plain English analogy:** Think of this as a paint mixing recipe. Given "light" or "dark," it returns the exact palette (primary blue, background, text colors) and a few default styling rules (rounded corners, no shadow on buttons) that every MUI component in the app will use automatically.

**Why it's a function and not a static object:** Because two themes (light/dark) share most of their *structure* (same shape, same component overrides) but differ in *values*. A factory function avoids duplicating that structure.

**Key sections:**
- `palette` — defines `primary`, `secondary`, `error/warning/success/info`, `background`, `text`, `divider` colors, swapping values based on `isDark`.
- `typography.fontFamily` — sets the global font stack (Inter first).
- `shape.borderRadius` — global corner rounding (12px) applied to MUI components by default.
- `components` — per-component default prop/style overrides: e.g. every `<Button>` defaults to `variant="contained"`, has no text-transform (MUI defaults to uppercase button text — this disables that), and a custom border radius. `MuiPaper` gets a 1px border so cards look "card-like" instead of relying purely on shadows.

**If removed:** `App.jsx`'s `createAppTheme` import would fail to resolve; the whole app would crash at build time.

---

### 2.5 `src/components/Header.jsx` — Top Bar / Toolbar

**Purpose:** Shows the current page's title/subtitle and a row of action buttons (Edit, Delete, Export, Theme toggle, Add Job) that change depending on context. It also hosts the `JobForm` modal and the delete-confirmation dialog — meaning the *trigger buttons* live here, but the actual *create/edit form* and *delete confirmation UI* are rendered as children, conditionally shown.

**Why it exists:** Keeps page-level chrome (titles, global actions) separate from page *content* (Dashboard/JobList/etc). This is a classic **toolbar pattern**.

**Imports:**
- `JobForm` — the modal dialog component this Header controls.
- `exportJobsToCsv` — utility function, called directly on click (not a prop passed down further — Header owns the "Export" button entirely).
- MUI icon components (`AddIcon`, `EditIcon`, etc.) — visual icons for each button; purely presentational.
- MUI `Button`, `Dialog*` components — used to build the delete-confirmation dialog.

**`PAGE_META`** — a static lookup object mapping page key → `{ title, sub }`. This avoids a chain of `if/else` in the JSX; it's a clean **derived-state-via-lookup-table** pattern.

**Props received (Props Analysis):**

| Prop | Source | Data or callback? | Effect on rendering |
|---|---|---|---|
| `jobs` | `App.jsx` state | Data | Used to enable/disable the Export button (`jobs.length === 0`) |
| `onCreate` | `App.handleCreateJob` | Callback | Passed straight through to `JobForm` |
| `onUpdate` | Inline wrapper in `App.jsx` that calls `handleUpdateJob` then `onCancelEdit` | Callback | Passed to `JobForm`; closes edit mode after saving |
| `onEdit` | Inline function in `App.jsx` that looks up the selected job and sets `editingJob`/`isEditing` | Callback | Wired to the Edit button's `onClick` |
| `onDelete` | Inline function in `App.jsx` calling `handleDeleteJob(selectedJobId)` | Callback | Wired to the delete-confirm dialog's Delete button |
| `onCancelEdit` | `App.onCancelEdit` | Callback | Used when modal closes without saving |
| `canEdit` / `canDelete` | `Boolean(selectedJobId)` computed in `App.jsx` | Data | Disables Edit/Delete buttons when nothing is selected |
| `isEditing` | `App.jsx` state | Data | Disables Add button, controls a `useEffect` that auto-opens the modal |
| `editingJob` | `App.jsx` state | Data | Passed to `JobForm` as `jobToEdit` (only when `isEditing`) |
| `activePage` | `App.jsx` state | Data | Looks up `PAGE_META`, decides whether to show row actions (`showRowActions`) |
| `themeMode` | `App.jsx` state (`mode`) | Data | Decides which icon (sun/moon) to show |
| `onToggleTheme` | `App.toggleTheme` | Callback | Wired to the theme button |

**Local state:**
- `open` (useState) — controls whether the `JobForm` dialog is visible. Owned locally because *Header* is responsible for the Add/Edit modal's open/closed UI state, even though the *data* inside the form is owned by `JobForm` itself.
- `confirmDelete` (useState) — controls the delete-confirmation dialog's visibility, a separate concern from the form modal.

**Effect:**
```js
useEffect(() => {
  if (isEditing) setOpen(true);
}, [isEditing]);
```
- **When:** Runs whenever `isEditing` changes.
- **Why:** When the parent sets `isEditing = true` (user clicked "Edit"), this effect ensures the modal actually opens, since `open` is local state that the parent can't set directly.
- This is a **derived-open-state synchronization** pattern — slightly indirect, but necessary because `open` must support being toggled by Header's own "Add Job" button too (which doesn't go through `isEditing`).

**Function: `handleClose()`**
- Closes the dialog (`setOpen(false)`), and if it was in edit mode, calls `onCancelEdit()` to clear `editingJob`/`isEditing` in the parent. Without this, closing the dialog mid-edit (e.g. clicking outside it) would leave `isEditing` stuck `true`, disabling the Add button forever.

---

### 2.6 `src/components/JobForm.jsx` — Create/Edit Modal

**Purpose:** A single reusable dialog that handles **both** creating a new job and editing an existing one. Whether it's in "create" or "edit" mode is determined entirely by whether `jobToEdit` is truthy.

**Why one component for both:** Create and Edit forms have nearly identical fields. Duplicating them into `CreateJobForm` and `EditJobForm` would mean every field change must be made twice. This is **component reuse via conditional behavior** — a single source of truth for "what does a job form look like."

**Props (Props Analysis):**

| Prop | Source | Type | Purpose |
|---|---|---|---|
| `onCreate` | `Header` → `App.handleCreateJob` | Callback | Called on submit when creating |
| `onUpdate` | `Header` → wrapped `App.handleUpdateJob` | Callback | Called on submit when editing |
| `open` / `setOpen` | `Header`'s local state | Data + callback (controlled component pattern) | Lets the *parent* control visibility — see "Controlled vs Uncontrolled" below |
| `hideTrigger` | `Header` passes `true` | Data | Suppresses the form's own "+ Add Job" trigger button, since Header has its own |
| `jobToEdit` | `Header`'s `editingJob` (or `null`) | Data | Determines create vs edit mode and pre-fills the form |
| `onClose` | `Header.handleClose` | Callback | Notifies the parent when the dialog closes (for any cleanup) |

**The "controlled vs uncontrolled" trick:**
```js
const [internalOpen, setInternalOpen] = useState(false);
const open = externalOpen ?? internalOpen;
const setOpen = setExternalOpen ?? setInternalOpen;
```
This makes `JobForm` dual-mode: if a parent passes `open`/`setOpen`, the component is **controlled** (parent owns the truth). If not, it manages its own `internalOpen` state and is **uncontrolled** (self-sufficient, usable standalone with its own "+ Add Job" button). This is a well-known React pattern for building flexible reusable components.

**State (`useState`):**
- `form` — the entire form's field values as one object (`company`, `title`, `status`, `date`, `statusChangeDate`, `link`, `notes`). Storing all fields in one object (rather than 7 separate `useState` calls) keeps `handleChange` generic (one handler for every input via `name`).
- `linkError` — validation error message specifically for the URL field, shown as MUI `TextField` helper text.

**Effect: populate form when editing**
```js
useEffect(() => {
  if (!open) return;
  if (jobToEdit) { ...prefill from jobToEdit... }
  else { ...reset to blank defaults... }
  setLinkError("");
}, [open, jobToEdit]);
```
- **When:** Runs whenever the dialog opens/closes or which job is being edited changes.
- **Why:** Each time the dialog opens, the form must reflect either the selected job's current data (edit mode) or blank defaults (create mode). Without this, opening the form a second time would still show the previous session's leftover values.
- **Side effect:** Pure state update, no I/O.

**Function: `handleChange(e)`**
- Generic input handler: reads `e.target.name` and `e.target.value`, updates the corresponding key in `form` via spread (`{ ...prev, [name]: value }`). This is the textbook **controlled input** pattern — every `<TextField>`'s `value` comes from React state, and every keystroke updates that state via `onChange`.
- Also clears `linkError` as soon as the user starts retyping the link field, so the error message doesn't stay stuck after they begin fixing it.

**Function: `handleSubmit(e)`**
1. `e.preventDefault()` — stops the browser's native form submission (which would reload the page).
2. Validates/normalizes the URL via `validateAndNormalizeUrl(form.link)` (see `utils/validation.jsx`).
3. If there's an error, sets `linkError` and **returns early** — nothing is created/updated, the dialog stays open so the user can fix it.
4. **Edit branch** (`if (jobToEdit)`): builds a `partial` object of changed fields. Critically, **if the status field changed**, it adds `partial.statusDate = form.statusChangeDate` — this tells the backend "record a new status-history entry dated this." Then calls `onUpdate(jobToEdit.id, partial)` and closes the dialog.
5. **Create branch:** builds a brand-new job object including a client-generated `id` via `crypto.randomUUID()` (Web Crypto API, built into modern browsers — generates a cryptographically random UUID with no library needed), calls `onCreate(job)`, closes the dialog, and resets the form back to blanks.

**Business problem solved:** This single function is the gatekeeper for data integrity entering the system — it's the only path through which a job is created or modified, and it's where the "did the status change? then record history" business rule lives.

**The "status change date" UI (conditional rendering):**
```jsx
{jobToEdit && form.status !== jobToEdit.status && (
  <TextField name="statusChangeDate" label={`Date moved to "${form.status}"`} .../>
)}
```
Only appears while editing an existing job *and* the user has picked a different status than what it currently has. This is **derived/conditional rendering** driven by comparing two pieces of state (`form.status` vs `jobToEdit.status`), not a separate boolean flag — a good example of not over-engineering state.

**`StatusTimeline` embed:** Also only shown while editing, and only if there's history to show. It builds a fallback single-entry history from `jobToEdit.status`/`date` if the job predates the `statusHistory` feature (defensive backward-compatibility logic for old data).

---

### 2.7 `src/components/JobList.jsx` — Table View

**Purpose:** Renders the full table of jobs on the "Applications" page in table form, with row selection and a "stale" warning badge for applications that have sat too long without status movement.

**Module-level constants:**
- `STALE_DAYS = 7` — business rule constant: after a week with no status change, flag it.
- `ACTIVE_STATUSES = new Set(["Applied", "Interviewing"])` — only these statuses can go "stale" (an Offer or Rejection is already resolved, so staleness is irrelevant).

**Function: `daysSince(dateStr)`**
- Input: an ISO date string.
- Computes whole days between now and that date using millisecond math (`86_400_000` ms = 1 day). The underscore in `86_400_000` is a JS numeric separator for readability — purely cosmetic, doesn't affect the value.
- Returns 0 if no date given.

**Function: `lastActivityDate(job)`**
- Returns the date of the most recent entry in `job.statusHistory` if it exists, otherwise falls back to `job.date` (the original application date). This means staleness is measured from the *last status change*, not the original apply date — a more accurate "how long has this been sitting idle" measure.

**Component logic:**
- Early return: if `jobs.length === 0`, shows a friendly empty-state message instead of an empty table.
- Otherwise renders a `<table>` with one `<tr>` per job. Clicking a row toggles selection: `onSelect(job.id === selectedJobId ? null : job.id)` — clicking the already-selected row deselects it (a toggle, not just a "select").
- The status cell shows a colored pill (`status-pill` class + status name) and, conditionally, a "stale badge" warning if the job is in an active status and has been inactive ≥7 days.
- The link cell either renders a clickable "Open ↗" anchor (with `e.stopPropagation()` so clicking the link doesn't also trigger row selection) or an em-dash placeholder if there's no link.

**Props:**
| Prop | Source | Type | Effect |
|---|---|---|---|
| `jobs` | `App.jsx`'s `filtered` | Data | The rows to render |
| `selectedJobId` | `App.jsx` state | Data | Highlights the selected row (`selected` class) |
| `onSelect` | `App.jsx`'s `setSelectedJobId` | Callback | Fired on row click |

**What this component should/should not own:** Should own purely presentational/derived logic (staleness calculation, formatting). Should **not** own the actual jobs array or selection state — those are lifted to `App.jsx` because `Header` also needs to know what's selected.

---

### 2.8 `src/components/kanbanBoard.jsx` — Drag & Drop Board View

**Purpose:** An alternate visualization of the same job data as `JobList`, but as a Trello-style board with one column per status, where dragging a card to a different column changes that job's status.

**Note on filename:** The file is `kanbanBoard.jsx` (lowercase k) while imported in `App.jsx` as `KanbanBoard.jsx` (uppercase K). On case-insensitive filesystems (Windows, default macOS) this works fine; on case-sensitive filesystems (Linux, including most CI/CD and Vercel build containers) **this import would fail to resolve**, breaking the production build. This is a real, fixable bug worth flagging.

**Import:** `DragDropContext, Droppable, Draggable` from `@hello-pangea/dnd` — a maintained fork of the now-archived `react-beautiful-dnd` library. This library handles all the complex mouse/touch/keyboard drag physics, accessibility, and animation so the app doesn't have to implement drag-and-drop from scratch (which is notoriously fiddly to get right, especially for accessibility).

**Constants:** `COLUMNS` (the four fixed statuses) and `COLORS` (per-status accent colors, duplicated from `Dashboard.jsx`/`Analytics.jsx` — see Weaknesses).

**Function: `onDragEnd(result)`**
- Called automatically by the dnd library when a drag gesture completes.
- `if (!result.destination) return;` — guards against the user dropping a card outside any valid column (e.g., dropping it in empty space), which would make `destination` `null`.
- Extracts `jobId` from `result.draggableId` (each `Draggable` is keyed by `job.id`) and `newStatus` from `result.destination.droppableId` (each `Droppable` column is keyed by its status name).
- Calls `onUpdate(jobId, { status: newStatus })` — the *same* `handleUpdateJob` function from `App.jsx` used by the edit form. This means dragging a card and editing a job's status via the form are two different UIs funneling into the exact same business logic and API call — good reuse.

**Important nuance:** Unlike the edit form, dragging in the Kanban board does **not** prompt for a "status change date" — it silently lets the backend default to "today" (see `[id].js` backend logic). This is a UX inconsistency worth noting (see Engineering Assessment): the same business action (changing status) produces a less precise history entry depending on which UI path the user used.

**Rendering structure (composition):**
```
DragDropContext (manages global drag state)
 └─ for each status: a column div
     ├─ header (status name + count)
     └─ Droppable (a column that accepts drops)
         └─ for each job in that column: Draggable (the card)
```
This is **render props** — `Droppable` and `Draggable` both take a function-as-child (`{(provided) => (...)}`) instead of plain JSX children, because the library needs to inject `ref`s and drag-related props (`provided.draggableProps`, `provided.dragHandleProps`) into your markup before it knows what that markup looks like.

**Inline styles:** Every visual style here is a JS object passed to `style={{...}}` rather than CSS classes (unlike every other component, which uses `.css` files). This is inconsistent with the rest of the codebase's styling approach — a maintainability smell (see Engineering Assessment), though functionally harmless.

---

### 2.9 `src/components/Dashboard.jsx` — Overview Page

**Purpose:** The landing page. Gives an at-a-glance summary: 4 KPI (Key Performance Indicator) cards, a "Recent Activity" list (last 5 jobs by date), and a donut chart breaking down the pipeline by status.

**Imports:**
- `getJobStats` from `utils/stats.js` — computes totals and success rate (shared logic, also used by `Analytics.jsx` and `Settings.jsx` — good reuse, single source of truth for "how do we count statuses").
- `recharts` components (`ResponsiveContainer, PieChart, Pie, Cell, Tooltip`) — a charting library built on top of D3 and SVG, but exposing a declarative React-component API instead of raw D3 imperative code. `ResponsiveContainer` makes the chart resize with its parent automatically.
- MUI icon imports — purely decorative, one per KPI card.

**Sub-component: `KPI({ label, value, meta, icon, tone, children })`**
- A small reusable "stat card" — not exported, used only within this file. Takes `children` so the Offer card can inject a progress bar without the `KPI` component needing to know about progress bars specifically. This is **component composition**: `KPI` provides the card chrome; the parent decides what extra content goes inside.

**Main function `Dashboard({ jobs = [] })`:**
- `const { totals, successRate } = getJobStats(jobs);` — derives all the numbers needed; no internal state at all. This entire component is **stateless and purely derived** — given the same `jobs` prop, it always renders the same output (a "pure" presentational component).
- `active = totals.Applied + totals.Interviewing` — derived metric: jobs not yet resolved.
- `pieData` — reshapes `totals` into the array-of-objects shape Recharts' `<Pie>` expects, filtering out zero-value slices so the chart doesn't show empty wedges.
- `recent` — copies `jobs` (`[...jobs]` to avoid mutating the original array with `.sort`), sorts by date descending, takes the first 5.

**Why copy before sorting:** `Array.prototype.sort()` mutates the array in place. If you called `jobs.sort(...)` directly, it would silently reorder the `jobs` array reference that other components/effects also depend on, causing subtle bugs elsewhere. `[...jobs].sort(...)` is the correct, defensive pattern.

**Rendering:** KPI grid → two-panel grid (Recent Activity list / Donut chart). The donut's center label (`donut-center`) is an absolutely-positioned `<div>` layered over the SVG chart via CSS — a common trick since Recharts doesn't natively support "donut chart with text in the middle."

---

### 2.10 `src/components/Analytics.jsx` — Trends Page

**Purpose:** Deeper, time-based analysis: applications-per-month (stacked bar chart) and overall status breakdown (pie chart), plus 4 different KPIs than the Dashboard (Response Rate, Offer Rate instead of raw counts).

**Function: `getMonthlyData(jobs)`** (local to this file, not shared)
- Groups jobs into buckets keyed by `"Mon 'YY"` (e.g., `"Jun '26"`) using `toLocaleDateString`.
- `if (isNaN(d)) continue;` — skips any job with an unparseable date, preventing a single bad record from crashing the chart.
- Each bucket tracks counts per status (`Applied`, `Interviewing`, `Offer`, `Rejected`).
- `_sort: d.getFullYear() * 12 + d.getMonth()` — a clever trick to get a single sortable integer representing "month index since year 0," used purely so months can be sorted chronologically rather than alphabetically (alphabetical would put "Apr" before "Jan", which is wrong).
- Returns `Object.values(byMonth).sort(...)` — converts the lookup object into an ordered array for Recharts.

**Derived stats specific to Analytics:**
- `responded = Interviewing + Offer + Rejected` — anyone who got *any* reaction beyond silence.
- `responseRate = responded / total * 100` — "how often do I hear back at all," as opposed to Dashboard's raw counts.
- `successRate` (from shared `getJobStats`) is relabeled here as "Offer Rate."

**Why duplicate `COLORS` and `KPI` instead of sharing with `Dashboard.jsx`:** Both files define their own local `COLORS` object and local `KPI` component, with slightly different values/props (`Dashboard`'s `COLORS` uses CSS variables like `"var(--st-applied)"`; `Analytics`'s `COLORS` uses literal hex codes). This is **duplicated code** — a maintainability weakness flagged later; ideally both would import from one shared `constants.js` and one shared `KPI.jsx`.

---

### 2.11 `src/components/Settings.jsx` — Preferences Page

**Purpose:** A simple page combining a stats summary strip, a theme-toggle card, and a CSV-export card.

**No local state at all** — every value (`mode`, `jobs`) is a prop; every action (`onToggleTheme`, the CSV export) is either a passed-in callback or a direct utility call. This is intentionally a thin, "dumb" presentational component.

**Props:**
| Prop | Source | Type |
|---|---|---|
| `mode` | `App.jsx` state | Data |
| `onToggleTheme` | `App.toggleTheme` | Callback |
| `jobs` | `App.jsx` state | Data |

Uses `getJobStats` (shared) for the summary numbers, and calls `exportJobsToCsv(jobs)` directly on click — same utility function `Header.jsx` also uses, so there are now **two independent "Export" buttons** in the app (Header's toolbar button and this Settings page button) that both call the exact same function — intentional redundancy for discoverability, not a bug.

---

### 2.12 `src/components/Sidebar.jsx` — Left Navigation

**Purpose:** The persistent left-hand navigation rail with the app brand/logo and four nav links (Dashboard, Applications, Analytics, Settings).

**`NAV` constant:** An array of `{ key, label, icon }` objects — data-driven navigation. Adding a fifth page later means adding one entry to this array and one `case` in `App.jsx`'s conditional render, rather than hand-writing a fifth `<button>` JSX block. This is good practice — config-driven UI instead of repeated markup.

**Props:**
| Prop | Source | Type | Effect |
|---|---|---|---|
| `activePage` | `App.jsx` state | Data | Determines which nav link gets the `active` CSS class and `aria-current="page"` |
| `setActivePage` | `App.jsx`'s `setActivePage` | Callback | Fired when a nav button is clicked — this is the **entire navigation system** of the app (no React Router) |

**Architecturally important:** Sidebar doesn't own navigation state — it only *displays* it and *requests changes* to it. `App.jsx` is the sole owner. This is correct lifting-state-up since `Header` also needs to know `activePage` (for the title).

---

### 2.13 `src/components/StatusTimeline.jsx` — History Visualization

**Purpose:** A small vertical "stepper" UI showing the sequence of status changes a job has gone through (e.g., Applied on June 1 → Interviewing on June 10 → Offer on June 20), used inside `JobForm` when editing.

**Pure presentational component** — takes one prop, `history` (array of `{ status, date }`), and renders nothing if it's empty/missing (`if (!history || history.length === 0) return null;` — a classic **guard clause** to avoid rendering broken UI for missing data).

**Rendering trick:** For each entry except the last, it draws a connecting vertical line (an absolutely-positioned `<Box>`) between dots — building a timeline purely with CSS positioning rather than a charting library, since this is simple enough not to need one.

**Color logic:** `STATUS_COLOR[entry.status] || "var(--primary)"` — falls back to the primary theme color if an unrecognized status ever sneaks in (defensive coding against bad/legacy data).

---

### 2.14 `src/utils/validation.jsx` — URL Validator

**Purpose:** A pure function, `validateAndNormalizeUrl(value)`, that both validates *and* fixes up a user-typed URL.

**Why `.jsx` extension despite no JSX syntax inside:** Likely a naming oversight — Vite/Babel will still transpile it fine (a `.jsx` file with no JSX is just valid JS), but it's misleading to other developers; should be renamed to `.js`. Flagged as a minor cleanliness issue.

**Logic line by line:**
1. `if (!value) return { error: "Link is required", url: "" };` — empty input is immediately rejected.
2. Try parsing `value` directly as a URL via the built-in `URL` constructor. If the user typed a full URL like `https://company.com`, this succeeds.
3. `if (!u.hostname.includes(".")) throw ...` — guards against technically-valid-but-useless URLs like `http://localhost` or `http://a` that have no domain dot — a job-link is presumably always a public website.
4. If step 2 fails (e.g., user typed `company.com/careers` with no protocol), it retries by prepending `https://` and parsing again — this is the **auto-fix UX**: most users don't type `https://`, so the app quietly fixes it for them instead of just rejecting it.
5. If *that* also fails, returns a final, user-facing error message.

**Inputs:** a string (possibly empty/malformed).
**Outputs:** `{ error: string, url: string }` — exactly one of the two is meaningful at a time (if there's an error, `url` is empty; if there's a valid `url`, `error` is empty).
**Side effects:** none — pure function.
**Business problem solved:** Job links pasted from various sources (browser address bar, copy-pasted from email, etc.) come in inconsistent formats; this normalizes them all into a clickable `https://...` URL and rejects garbage before it's saved.

---

### 2.15 `src/utils/stats.js` — Shared Statistics

**Purpose:** One pure function, `getJobStats(jobs)`, that all three "numbers" pages (Dashboard, Analytics, Settings) call to avoid recomputing/duplicating the same counting logic three times.

**Logic:**
1. Initializes a `totals` object with `total` (overall count) plus a zeroed counter for each of the four statuses.
2. Loops through `jobs` once, incrementing `totals[j.status]` — note the defensive `if (totals[j.status] != null)` guard, which silently ignores any job with a status string that isn't one of the four known ones (defensive coding against bad data, rather than crashing).
3. Computes `successRate = Offer / total * 100`, rounded, or `0` if there are no jobs (avoiding a `NaN` from dividing by zero).

**This is the textbook example of avoiding duplicated business logic** — instead of three components each writing their own counting loop (and risking them silently drifting out of sync over time), there's one function that defines "what counts as a stat" for the whole app.

---

### 2.16 `src/utils/exportCsv.js` — CSV Export

**Purpose:** Converts the in-memory `jobs` array into a downloadable `.csv` file, entirely client-side (no server round-trip needed).

**Line by line:**
1. Guard: if there are no jobs, `alert()` and bail out. (Using the browser's native blocking `alert()` is a minor UX smell — a custom toast/snackbar would be less jarring — but functionally fine.)
2. `headers` — the column titles for the CSV.
3. `rows` — maps each job to an array of its field values in the same order as `headers`. `j.notes?.replace(/\n/g, " ")` uses optional chaining (`?.`) to safely handle jobs with no notes (`undefined`), and replaces newlines with spaces so a multi-line note doesn't break the CSV's row structure.
4. Builds the CSV text: header row + each data row, every value wrapped in quotes (`"${v || ""}"`) so commas inside notes don't get misinterpreted as new columns, joined by `\n`.
5. Creates a `Blob` (a binary-data-like object usable in the browser) of MIME type `text/csv`, gets a temporary `URL.createObjectURL(blob)` pointing at it.
6. Builds an invisible `<a>` tag with `download="job-applications.csv"`, programmatically clicks it (triggering the browser's native "save file" behavior), then removes the tag and revokes the blob URL to free memory. This whole dance (`createElement` → `appendChild` → `.click()` → `removeChild` → `revokeObjectURL`) is the standard browser-only pattern for triggering a file download from JS without a server endpoint.

**Side effects:** DOM manipulation, triggers a native browser download, calls `alert()`.

---

### 2.17 `src/index.css`, `src/styles/*.css`

Plain CSS files, one per component "family" (`Header.css`, `Dashboard.css` shared by Analytics too, `JobList.css`, `Job.css`, `Settings.css`, `Sidebar.css`, `App.css`). They rely on CSS custom properties (variables) like `--card-bg`, `--fg`, `--muted`, `--primary`, which are presumably defined once at the `:root` / `[data-theme]` level and swapped by the theme-sync effect in `App.jsx`. This is why `KanbanBoard` mixing in literal hex codes (`COLORS` object) instead of these CSS variables for some accents is a minor inconsistency (it does use `var(--card-bg)` for structure, but its status `COLORS` map uses raw hex instead of `var(--st-applied)` etc. like `Dashboard.jsx` does).

---

### 2.18 Backend: `api/_lib/store.js` — Storage Abstraction

**Purpose:** A single module that abstracts over *two different storage backends* so the rest of the API code doesn't need to know or care which one is active.

**Why this exists — the problem it solves:** Vercel serverless functions are stateless and ephemeral — you can't just keep a JS array in memory and expect it to persist between requests (each request might hit a fresh container). The "real" solution is **Vercel KV** (a hosted Redis-compatible key-value store). But requiring KV setup before the app can even run anywhere would be a bad developer experience for local testing/demos. So this file:
1. Checks if KV environment variables (`KV_REST_API_URL`/`KV_URL`, `KV_REST_API_TOKEN`) are present.
2. If yes, creates a real KV client and all reads/writes go to the cloud.
3. If no, falls back to an in-memory object on `globalThis`, **which only survives as long as that specific server process stays warm** — i.e., it's fine for a quick demo but **will silently lose all data** on a cold start/restart. This is explicitly commented in the code and is an important operational caveat to know.

**Why `globalThis.__MEM_STORE__` and not a plain module-level variable:** In serverless environments, module state *can* sometimes get reset between invocations even within the same container depending on the platform's bundling; using `globalThis` is the more reliable way to ensure the same object survives across multiple function calls in one warm container.

**Functions:** `getJobs`, `setJobs`, `getSettings(id)`, `setSettings(id, obj)` — straightforward read/write pairs, each checking `hasKV` to route to the correct backend.

---

### 2.19 Backend: `api/jobs/index.js` — Collection Endpoint

**Purpose:** Handles `GET /api/jobs` (list all) and `POST /api/jobs` (create one).

**Function: `readJson(req)`**
- Serverless request objects don't always come with a pre-parsed `.body`. This function handles both cases: if `req.body` is already an object (some platforms parse it for you), use it directly; otherwise, manually accumulate the raw HTTP request stream chunk by chunk (`req.on("data"...)`) and `JSON.parse` it once the stream ends. This low-level stream handling is necessary because these are raw Node.js-style HTTP handlers, not Express, which would normally do this parsing via middleware.

**`POST` handler logic:**
1. Reads/parses the JSON body.
2. Validates it's an object (else 400).
3. Defaults `status` to `"Applied"` and `date` to today if missing — defensive defaults so a malformed client request still results in a usable record.
4. Builds the canonical job record server-side, including generating an `id` if the client didn't send one (`randomUUID()` from Node's built-in `crypto` module).
5. **Initializes `statusHistory: [{ status, date }]`** — this is where status history *starts*; the client never sends this directly, the server always seeds it on creation.
6. Fetches the current jobs list, `unshift`s (prepends) the new job, saves it back.
7. Responds `201 Created` with the full job object (so the client's `setJobs((prev) => [created, ...prev])` gets the canonical server copy).

**Method guard:** any other HTTP method gets a `405 Method Not Allowed` with an `Allow` header — correct REST API etiquette.

---

### 2.20 Backend: `api/jobs/[id].js` — Single Resource Endpoint

**Purpose:** Handles `PATCH /api/jobs/:id` (update) and `DELETE /api/jobs/:id` (delete). The `[id]` filename syntax is Vercel/Next.js-style **dynamic routing** — the bracketed segment becomes `req.query.id`.

**`PATCH` handler — the most business-logic-dense file in the project:**
1. Finds the existing job by id (`String(j.id) === String(id)` — coercing both sides to string defensively, in case one is a number and the other a string).
2. 404 if not found.
3. **Strips `statusDate` out of the incoming partial** (`const { statusDate: incomingStatusDate, ...cleanPartial } = partial;`) — `statusDate` is a *meta-instruction* ("here's the date this status change happened"), not actually a field that belongs on the job record itself, so it must not be saved as a literal `job.statusDate` field.
4. **The core business rule:** if the incoming partial includes a `status` different from the job's current status, it appends a new entry to `statusHistory` (creating the array first if this is an old record that never had one), dated either by the client's `incomingStatusDate` (from the edit-form's "Date moved to..." field) or defaulting to today (e.g., when dragging a Kanban card, which doesn't ask for a date).
5. Merges `existing`, `cleanPartial`, and the new `statusHistory` (if computed) into `updated`, saves it back into the array, persists, and responds `200` with the full updated record.

**`DELETE` handler:** Finds the index, 404s if missing, otherwise removes it by slicing around that index (`jobs.slice(0, idx).concat(jobs.slice(idx + 1))` — a non-mutating removal, though since `jobs` here is a fresh array from `store.getJobs()` each time, mutating would have been safe too; this is just a defensively-written style), saves, responds `204 No Content` (the standard "deleted successfully, no body to return" status).

---

### 2.21 Backend: `api/settings/[id].js` — Theme Persistence Endpoint

**Purpose:** `GET`/`PATCH /api/settings/:id` for reading/writing a theme preference server-side.

**Important:** As noted in `api.js`'s `ThemeAPI` analysis, **this endpoint currently has no caller in the frontend** — the app persists theme via `localStorage` instead. This endpoint is fully functional but effectively dead code from the frontend's perspective. It would only matter if the team later wants theme preference to sync across devices/browsers for the same user (which would require an actual user/auth concept — currently there's only ever "settings id 1", i.e., one global theme for everyone, not per-user).

---

### 2.22 `db.json`, `package.json`, `vite.config.js`

- **`db.json`** — the fake dataset for `json-server`, used only when running `npm run server` / `npm run api` locally. Lets you develop the frontend against a realistic REST API without deploying serverless functions.
- **`vite.config.js`** — configures the dev server to proxy any request to `/api/*` over to `http://localhost:3001` (where `json-server` listens), stripping the `/api` prefix. This is *why* `API_BASE = "/api"` works seamlessly in both local dev (proxied to json-server) and production (routed directly to the real Vercel functions, which also live under `/api`) — same client code, two different backends, zero frontend changes needed.
- **`package.json`** — Notable dependencies: `@mui/material` + `@mui/icons-material` (UI library), `@hello-pangea/dnd` (drag-and-drop), `recharts` (charts), `@vercel/kv` (production storage), `json-server` (local fake API, dev-only).

---

## 3. Data Flow Traces (User Action → Re-render)

### 3.1 Create Job
```
User clicks "Add Job" (Header)
 → Header: setOpen(true) → JobForm dialog opens (jobToEdit = null → "create mode")
 → User fills fields → JobForm.handleChange updates local `form` state on every keystroke
 → User clicks "Save" → JobForm.handleSubmit
    → validateAndNormalizeUrl(form.link)
    → if valid: builds `job` object with a new crypto.randomUUID()
    → calls onCreate(job)  [prop chain: JobForm → Header → App.handleCreateJob]
       → App.handleCreateJob: await JobAPI.create(job)  → POST /api/jobs
          → backend: assigns canonical id/date/status, seeds statusHistory, saves, returns 201 + job
       → setJobs(prev => [created, ...prev])
    → React re-renders App and all children that read `jobs` (Dashboard/Analytics/Settings/JobList/KanbanBoard)
 → JobForm.closeDialog() → dialog closes, form resets to blank defaults
```

### 3.2 Edit Job
```
User clicks a row in JobList → onSelect(job.id) → App: setSelectedJobId(id)
 → Header's canEdit becomes true (re-render)
User clicks "Edit" (Header) → App's inline onEdit handler:
   finds job in `jobs` by selectedJobId → setEditingJob(job) → setIsEditing(true)
 → Header's useEffect([isEditing]) fires → setOpen(true) → modal opens
 → JobForm's useEffect([open, jobToEdit]) fires → form prefilled with job's data
User edits fields, possibly changes Status dropdown
 → if status changed: a new "Date moved to X" field appears (conditional render)
User clicks Save → JobForm.handleSubmit (edit branch)
   → builds `partial`, includes statusDate only if status changed
   → onUpdate(jobToEdit.id, partial) [prop chain: JobForm → Header → App's wrapped onUpdate]
      → App: await handleUpdateJob(id, partial) → PATCH /api/jobs/:id
         → backend appends to statusHistory if status changed, merges fields, returns updated job
      → setJobs(prev => prev.map(j => j.id === id ? updated : j))
      → onCancelEdit() → isEditing=false, editingJob=null
 → re-render: table/board/charts reflect the new status; modal closes
```

### 3.3 Delete Job
```
User selects a row → selectedJobId set (as above) → canDelete becomes true
User clicks "Delete" (Header) → setConfirmDelete(true) → confirmation Dialog opens
User clicks "Delete" in the dialog → App's onDelete() → handleDeleteJob(selectedJobId)
   → await JobAPI.remove(id) → DELETE /api/jobs/:id → backend removes it, 204
   → setJobs(prev => prev.filter(j => j.id !== id))
   → if selectedJobId === id: setSelectedJobId(null)  (avoids dangling selection)
 → re-render: row disappears from table/board/all stat pages
```

### 3.4 Select Job
```
User clicks a JobList row → onSelect(id === selectedJobId ? null : id)
 → App: setSelectedJobId(...)
 → re-render: JobList highlights the row (selected class);
   Header's canEdit/canDelete flip, enabling/disabling its buttons
```
No network call — purely a client-side UI state change.

### 3.5 Change Status (via Edit form OR Kanban drag)
Two different entry points converge on one function:
```
Path A: Edit form → handleSubmit → onUpdate(id, { status, statusDate? })
Path B: Kanban drag-drop → onDragEnd(result) → onUpdate(jobId, { status: newStatus })  [no statusDate]
   Both call → App.handleUpdateJob(id, partial) → PATCH /api/jobs/:id
   → backend: status changed? append to statusHistory (dated by client's statusDate, or today if absent)
   → setJobs(...) → re-render
```
**Key insight:** the Kanban path never supplies a `statusDate`, so dragged status changes are always recorded as "today," while the form lets the user backdate the change. This is a deliberate-but-inconsistent UX tradeoff (drag = fast/no-friction, form = precise/full control).

### 3.6 Kanban Drag & Drop (full mechanics)
```
User starts dragging a card (mousedown on a Draggable) → @hello-pangea/dnd library takes over,
   tracking pointer position, rendering a drag preview, animating other cards out of the way
User drops the card on a different column (a Droppable with a different droppableId/status)
 → library calls KanbanBoard's onDragEnd(result) with { draggableId: jobId, destination: { droppableId: newStatus } }
 → guard: if dropped outside any column, result.destination is null → no-op
 → onUpdate(jobId, { status: newStatus }) → flows into App.handleUpdateJob (see 3.5)
 → re-render: columnJobs = jobs.filter(j => j.status === status) recomputes per column,
   so the card visually "moves" because it's now counted in a different column's filter, not because
   of any special animation logic written by this app — the library + the filtered re-render do all the work
```

### 3.7 Theme Toggle
```
User clicks sun/moon icon (Header or Settings)
 → onToggleTheme() → App.toggleTheme()
    → next = mode === "light" ? "dark" : "light"
    → setMode(next)
    → localStorage.setItem("theme", next)
 → re-render triggers:
    - useEffect([mode]) sets document.documentElement[data-theme] → CSS variables flip instantly
    - useMemo([mode]) rebuilds the MUI theme object → all MUI components re-theme
```
No network call. Persisted purely via `localStorage`, so it survives a page refresh (read back in `App`'s `useState` initializer: `() => localStorage.getItem("theme") ?? "dark"`).

### 3.8 Search
```
(Currently: query state exists in App.jsx and is used in the `filtered` computation,
 but there is no visible search input wired to setQuery in the current JSX — see Section 13 Weaknesses.)
Intended flow (once wired): user types in a search box → onChange calls setQuery(value)
 → re-render → `filtered` (computed inline in App's render, not memoized) recalculates,
   filtering jobs whose company or title includes the query substring (case-insensitive)
 → JobList/KanbanBoard receive the new `filtered` jobs and re-render
```

### 3.9 Filter (by status)
```
(Same caveat as Search — statusFilter state and its use in `filtered` exist,
 but no dropdown currently calls setStatusFilter in App.jsx's JSX.)
Intended flow: user picks a status from a dropdown → setStatusFilter(status)
 → `filtered` re-evaluates its second .filter() step → only matching-status jobs remain
```

### 3.10 Analytics Calculations
```
App holds full `jobs` array (unfiltered) → passed as a prop directly to <Analytics jobs={jobs} />
 → Analytics calls getJobStats(jobs) [shared util] → { totals, successRate }
 → Analytics calls its own local getMonthlyData(jobs) → buckets by month, sorted chronologically
 → derived values (responseRate, pieData) computed inline on every render — no memoization,
   but cheap enough (single pass over the array) that this is a non-issue at realistic data sizes
 → Recharts components consume these derived arrays/objects and draw SVG charts
```
No state, no effects — Analytics is **100% a pure derived view** of whatever `jobs` currently is in `App`.

---

## 4. Architecture Review

```
                         ┌─────────────┐
                         │   App.jsx   │  ← STATE OWNER for: jobs, activePage,
                         │  (root)     │     selectedJobId, isEditing/editingJob,
                         └─────┬───────┘     query/statusFilter/sortBy/view, mode
                               │
        ┌──────────┬──────────┼───────────┬────────────┐
        ▼          ▼          ▼           ▼            ▼
   Sidebar      Header     Dashboard   Analytics    Settings
  (activePage  (jobs,       (jobs)      (jobs)      (mode, jobs)
   nav only)    selection,
                edit state,
                theme)
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

- **Parent component:** `App.jsx` — the only component with `useState` for *cross-page* concerns.
- **Child/leaf components:** `Sidebar`, `JobList`, `KanbanBoard`, `StatusTimeline`, `Dashboard`, `Analytics`, `Settings` — none of them hold app-wide state; they're consumers.
- **Components with their own local state:** `Header` (`open`, `confirmDelete` — modal visibility, a UI-only concern scoped to itself) and `JobForm` (`form`, `linkError`, `internalOpen` — form-editing concerns scoped to itself).
- **Shared state:** `jobs`, `activePage`, `selectedJobId`, `mode` — read by 2+ components, hence lifted to `App`.
- **Derived state (computed, never stored):** `filtered` (in `App`), `pieData`/`recent`/`active` (in `Dashboard`), `monthlyData`/`responseRate`/`pieData` (in `Analytics`), `totals`/`successRate` (via shared `getJobStats`, used in 3 places).
- **Prop drilling:** `onCreate`/`onUpdate` travel `App → Header → JobForm` (2 levels) — not deep enough yet to need Context, but it's the seed of prop drilling that would get worse if more nesting were added later.

---

## 5. React Concepts Used (Glossary, Grounded in This Codebase)

- **`useState`** — local component memory that persists across re-renders and triggers a re-render when changed. Every state table above is an example.
- **`useEffect`** — runs code *after* render, for things that aren't part of producing JSX: fetching data (`App`'s load effect), syncing to the DOM outside React (`data-theme` attribute), syncing a child's open/closed state to a parent prop (`Header`'s `isEditing` effect).
- **`useMemo`** — caches an expensive computation between renders unless its dependencies change. Used once: `muiTheme` in `App.jsx`, recomputed only when `mode` changes, not on every `jobs` update.
- **Controlled components** — form inputs whose value comes from React state and whose changes flow back through `onChange`, e.g. every `<TextField>` in `JobForm`. The alternative (uncontrolled, using refs) is not used anywhere here.
- **Lifting state up** — `jobs`, `activePage`, `selectedJobId`, `mode` all live in `App` precisely because more than one component needs them (textbook example: `selectedJobId` is set by `JobList`'s clicks but read by `Header`'s button-disabled logic).
- **Conditional rendering** — used everywhere: `{loading && ...}`, `{error && ...}`, `{activePage === "dashboard" && <Dashboard/>}`, `{jobToEdit && form.status !== jobToEdit.status && (...)}`.
- **Derived state** — `filtered`, `totals`, `successRate`, `pieData`, `monthlyData` are all *computed*, never stored in their own `useState`. This is correct React practice — storing something derivable in state risks it going stale/out of sync.
- **Prop drilling** — `onCreate`/`onUpdate`/`onEdit`/`onDelete` pass through `Header` purely to reach `JobForm` or the delete dialog; `Header` itself doesn't "use" most of them directly, it just relays them.
- **Component composition** — `KPI`'s `children` prop (Dashboard), `Droppable`/`Draggable`'s render-props pattern (KanbanBoard), `ThemeProvider` wrapping the whole tree.
- **Controlled vs. uncontrolled component design** — `JobForm`'s `open ?? internalOpen` dual-mode pattern, allowing it to be driven externally (by `Header`) or operate independently.

---

## 6. Business Features — How They Work Internally

- **Job CRUD** — `App.jsx`'s three handlers (`handleCreateJob/Update/DeleteJob`) are the sole front door; `JobAPI` translates them to HTTP; the backend (`api/jobs/*`) is the source of truth, always returning the canonical record, which the frontend trusts completely (never assumes its own optimistic copy is correct).
- **Status Timeline** — Born on the backend: every create seeds a one-entry `statusHistory`; every status-changing update appends an entry (dated either explicitly, via the edit form's date picker, or implicitly as "today," via Kanban drag). Displayed by `StatusTimeline.jsx`, only inside the edit form.
- **Follow-up Reminder System** — Lives entirely in `JobList.jsx` (`STALE_DAYS`, `ACTIVE_STATUSES`, `daysSince`, `lastActivityDate`). It's a purely client-side, computed-at-render warning badge — there's no actual notification/email/push system; "reminder" here means a visual badge in the table, not a triggered notification.
- **Analytics Dashboard** — Two flavors: `Dashboard.jsx` (today's snapshot: counts + recent items + donut) and `Analytics.jsx` (trends over time: monthly bar chart + response/offer rates). Both ultimately derive everything from the same root `jobs` array; neither stores its own copy.
- **Search / Filtering / Sorting** — State exists and the computation (`filtered` in `App.jsx`) is correctly wired, but (as flagged) the *UI controls* (an input box, a dropdown) to actually drive `query`/`statusFilter`/`sortBy` appear to be missing from the current `App.jsx` JSX — meaning these features are implemented in logic but not currently reachable by an end user. This is worth either fixing or removing the dead state.
- **Theme Persistence** — `localStorage`-based, synced to a `data-theme` HTML attribute that CSS responds to, and to MUI's theme object via `createAppTheme`. The backend's `ThemeAPI`/`api/settings` exists but is unused — a parallel, currently-redundant persistence mechanism.
- **Kanban Board & Drag-and-Drop Status Changes** — `@hello-pangea/dnd` handles all drag mechanics; `KanbanBoard.jsx` only needs to (a) group jobs into columns by filtering on `status`, and (b) translate a completed drag into the same `onUpdate(id, { status })` call the edit form uses.

---

## 7. Engineering Assessment

**Strengths**
- Clear, consistent state-ownership model — `App.jsx` correctly owns cross-cutting state; pages are mostly "dumb"/derived.
- Good separation of concerns: `api.js` isolates networking, `utils/stats.js` centralizes business math so three pages can't drift out of sync, `validation.jsx` isolates a genuinely tricky bit of logic (URL normalization) into a testable pure function.
- Thoughtful backend design for a "demo-able anywhere" app: the KV-or-memory fallback in `store.js` means the project runs with zero cloud setup, while still being production-capable if KV env vars are added.
- Status history is modeled server-side as an append-only log, which is the right way to track a changing field over time (rather than just overwriting `status` and losing the past).
- The Kanban drag-and-drop and the manual Edit form intentionally reuse the exact same `handleUpdateJob`/PATCH endpoint — no logic duplicated between two ways of doing the same business action.
- Reasonable defensive coding throughout: `isNaN(d)` guards, `?.` optional chaining, `!= null` checks, sensible fallbacks for legacy/missing data (e.g., `JobForm`'s synthesized single-entry history for jobs created before `statusHistory` existed).

**Weaknesses**
- **Search/Filter UI is wired in state but not in the visible JSX** — dead-looking functionality from a user's perspective; either finish wiring it or remove the unused state to reduce confusion.
- **Filename casing bug:** `kanbanBoard.jsx` vs. the `KanbanBoard.jsx` import in `App.jsx` — works on Windows/macOS, **will break the build on case-sensitive filesystems** (most Linux CI/CD, including Vercel's build containers, depending on configuration). This should be fixed immediately.
- **Duplicated constants/components:** `COLORS` maps and local `KPI` components are independently redefined in `Dashboard.jsx`, `Analytics.jsx`, and (a status-color variant of) `KanbanBoard.jsx`/`StatusTimeline.jsx`/`JobList.jsx` (the CSS `status-pill` classes). A shared `constants/statusColors.js` and a shared `<KPI/>` component would remove this risk of values silently diverging.
- **Dead code:** `ThemeAPI` in `api.js` and the entire `api/settings/[id].js` endpoint are unused by the frontend (theme persists via `localStorage` only). Either wire it up for cross-device sync or remove it.
- **Unused import:** `SearchIcon` in `App.jsx`.
- **No memoization of `filtered` in `App.jsx`** — recomputed on every render of `App`, including renders triggered by unrelated state (e.g., toggling the modal). At current scale (a personal job tracker, dozens-to-low-hundreds of rows) this is a non-issue, but it's the kind of thing that should be wrapped in `useMemo` once data volume grows.
- **In-memory storage fallback is a silent data-loss trap.** If a team deploys to Vercel without setting up KV env vars, the app will *appear* to work perfectly in testing, then lose all data on the next cold start, with no warning to the user. This should at minimum log a loud server-side warning, and ideally the frontend should detect/display a "non-persistent storage" banner.
- **No request-level validation on the backend** beyond defaults — e.g., `POST /api/jobs` doesn't reject a job with no `company`/`title`, it just stores empty strings. Validation logic that exists client-side (`JobForm`'s `required` attributes) isn't mirrored server-side, so a non-browser client (or buggy future code) could write garbage records.
- **Single global settings record (`id=1`)** — there's no concept of "users," so theme settings (if ever wired up) and all jobs are global to whoever has access to the deployment. Fine for a personal tool; would need a real auth/user model before this could be multi-tenant.
- **Inline styles in `KanbanBoard.jsx`** are inconsistent with every other component's CSS-file approach — harder to theme/maintain than the rest of the app.
- **CSV export uses a blocking native `alert()`** for the empty-state case — minor UX inconsistency vs. the rest of the app's styled UI.

**Scalability concerns**
- Whole-array refetch/recompute model: every render recomputes `filtered`/stats over the *entire* `jobs` array. Fine up to perhaps a few thousand rows; would need pagination, server-side filtering, or virtualization (e.g., for `JobList`'s table) well before real scale.
- The in-memory store keeps the *entire* dataset as one JSON blob (`kv.set("jobs", jobs)` writes the whole array every time). At larger scale this becomes a write-amplification problem — every single edit rewrites every job's data.
- No pagination on `GET /api/jobs` — the entire history is sent on every page load.

**Code quality review**
- Generally readable, decently named identifiers, sensible single-purpose functions. Comments are sparse but the code is mostly self-explanatory; where comments exist (`store.js`), they explain genuinely non-obvious reasoning (why `globalThis`, why KV is conditionally initialized) — exactly where comments should be used.
- Minor inconsistencies (inline styles vs CSS files, `.jsx` extension on a non-JSX util file, duplicated `COLORS`) suggest iterative, fast-moving development without a final cleanup pass — typical of a real-world project built feature-by-feature rather than a flaw of understanding.

**Maintainability review**
- Single-owner state model in `App.jsx` makes the data flow easy to trace (a real strength for onboarding new developers — as evidenced by this very document being traceable end-to-end).
- The biggest maintainability risk is **duplicated business constants** (status colors, KPI card markup) — a future status addition (e.g., "Withdrawn") would require updating `STATUSES` in `JobForm`, plus `COLORS` in 2-3 places, plus CSS `status-pill` classes, plus `ACTIVE_STATUSES`/stale logic in `JobList`, with no single place that enforces all of these stay in sync.

**UI/UX review**
- Clean, modern dashboard aesthetic (MUI + custom CSS variables, dark/light theming, KPI cards, charts) — looks professional for a portfolio piece.
- The stale-application badge in `JobList` is a genuinely thoughtful, real-world-useful feature (most job trackers don't proactively flag silence).
- Missing/unreachable search & filter controls are the most visible UX gap relative to what the code implies should exist.
- The Kanban drag path silently defaulting the status-change date to "today" (vs. the form's explicit date picker) is a subtle data-quality inconsistency a user might not notice.

**Architecture review**
- Sound for the app's current size: one root state owner, mostly-pure leaf components, a thin API layer, and a backend with a sensible storage abstraction. No React Router (acceptable, since there are only 4 "pages" controlled by simple string state — adding a router would be premature here, not a deficiency). No global state library (Redux/Zustand) — also appropriate; `useState` + lifting state up is the right level of complexity for this app's actual scope. The architecture would need to evolve (Context or a state library, pagination, real auth) only if the feature set grows significantly (multi-user, much larger datasets, more deeply nested UI).

---

## 8. Skill Assessment

Based on this codebase alone, the developer demonstrates skills consistent with **Strong Junior, trending toward Mid-Level.**

**Reasoning:**
- Correctly applies foundational patterns without being told to: lifting state up, derived vs. stored state, controlled components, pure presentational components, guard clauses, and defensive handling of legacy/missing data — these are *not* given for free; many junior developers store things in state that should be derived, or mutate arrays in place (notice the deliberate `[...jobs].sort()` in `Dashboard.jsx` — a junior mistake avoided).
- Designed a real, non-trivial backend feature (append-only `statusHistory`) that requires reasoning about *when* to mutate vs. append, and handling backward compatibility for records that predate the feature (`JobForm`'s synthesized single-entry history fallback) — this kind of forward-thinking compatibility handling is typically a mid-level instinct.
- Built a storage abstraction (`store.js`) that gracefully degrades from a managed cloud service to an in-memory fallback, with an awareness of *why* (cold starts, container reuse via `globalThis`) — shows real understanding of the serverless execution model, not just "it works on my machine."
- Reused the same backend mutation path (`handleUpdateJob`) across two very different UIs (form + drag-and-drop) instead of writing two separate, diverging code paths — a sign of thinking in terms of *business actions* rather than *UI components*.
- The weaknesses present (filename casing bug, dead code, duplicated constants, unwired search/filter state) are consistent with **moving fast on feature work without a final consolidation/cleanup pass** — a common and very fixable pattern at this level, not a sign of not understanding the concepts. A senior engineer would have caught the casing bug and duplication in review, but writing the feature work itself already shows solid command of React fundamentals and reasonable backend system design.

---

## 9. Improvement Roadmap

**High Impact**
1. **Fix the `kanbanBoard.jsx`/`KanbanBoard.jsx` casing mismatch** — this is a ticking time bomb that could break a production deploy on a case-sensitive build environment. Trivial fix, outsized risk.
2. **Wire up (or remove) Search and Status Filter UI** — the logic already exists; either add the missing input/dropdown controls in `App.jsx`'s Applications page, or delete the dead `query`/`statusFilter`/`sortBy` state to avoid confusing future maintainers.
3. **Server-side validation** on `POST`/`PATCH /api/jobs` (reject missing `company`/`title`, validate `status` is one of the known values) — currently the only validation is client-side and easily bypassed.
4. **Authentication / multi-user backend** — right now there's no concept of "whose jobs are these." Before this could be shared with real users (rather than a single personal deployment), basic auth (even a simple email/passwordless magic link) plus scoping all `jobs`/`settings` by user id is a prerequisite for almost every other "real product" feature.

**Medium Impact**
5. **Deduplicate status colors/KPI components** into shared `constants/statusColors.js` and a shared `<KPI/>` component imported by `Dashboard.jsx`, `Analytics.jsx`, and `KanbanBoard.jsx` — reduces the risk of colors silently diverging when a new status is added.
6. **Testing** — there are currently no automated tests anywhere in the project. Start with pure-function unit tests (`utils/stats.js`, `utils/validation.jsx`, `utils/exportCsv.js` are all trivially unit-testable with no mocking needed) before attempting component or integration tests.
7. **React Router** — not urgent at 4 pages, but if the app grows (e.g., a dedicated "job detail" page, deep-linkable URLs for sharing a specific application), introducing `react-router-dom` would replace the current `activePage` string-based pseudo-router with real, bookmarkable URLs.
8. **Activity feed** — a natural extension of the already-existing `statusHistory` data: a single chronological feed across *all* jobs (not just one job's timeline) showing "Moved Acme Corp to Interviewing — 2 days ago" would reuse existing data with no backend schema changes.
9. **Notifications** — turning the existing client-side-only "stale" badge (`JobList.jsx`) into an actual proactive notification (browser push, or a daily digest email) would meaningfully increase the app's real-world usefulness — but requires a backend job scheduler and (per #4) a real user/email model first.

**Low Impact**
10. **TypeScript** — would catch a class of bugs (e.g., a typo'd status string, an unexpected `undefined` field) for relatively low effort given the codebase is already organized into small, well-scoped files — but it's a "nice to have" polish item, not a functional gap, for a project of this size.
11. **File attachments** (resume/cover letter per application) — a genuinely useful feature for a job tracker, but it's the most infrastructure-heavy item on this list (needs file storage like Vercel Blob/S3, upload UI, size/type validation) relative to its impact on the *core* tracking workflow — appropriately low priority until the higher-impact items are settled.
12. **Smart insights** ("companies that respond fastest," "best day of week to apply") — fun and impressive in a demo, but depends on having enough real data volume to be statistically meaningful, and depends on the higher-impact multi-user/auth work existing first if this is meant to generalize beyond one person's own data.
