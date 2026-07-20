# Job Tracker — Complete Engineering Documentation

> Written for a developer joining the team who is still learning React.
> Every section explains things in plain English first, then in technical terms.
>
> **Updated (Revision 3):** this revision reflects a migration from the
> mocked, `localStorage`-only auth/data layer described in Revision 2 to a
> **real Supabase backend** — real hosted Postgres for job data, real
> Supabase Auth (hashed passwords, sessions, `onAuthStateChange`) for
> accounts. `MockAuthAPI`/`MockJobsAPI` are no longer called by anything.
> **As of this writing, this migration exists only in the working tree — it
> has not been committed.** See the new Section 0.1 for a full delta, and
> Section 10 for a point-by-point reconciliation against an external
> code-review-style critique this revision was written in response to.
>
> Revision 2's note remains accurate as history: it described the move from
> a real-but-abandoned Vercel/KV backend to a `localStorage` mock. This
> revision is the next step in that same story — from mock back to a real
> backend, just a different (and arguably better-suited) one than the
> original.

---

## 0. The Big Picture (read this first)

Think of this app like a personal CRM for your job hunt. Instead of tracking
customers, you track job applications: who you applied to, what stage you're
at (Applied → Interviewing → Offer/Rejected), and notes about each one.

It now has **three** conceptual layers, and — for the first time since
Revision 1 — **two of them are genuinely live at once**:

1. **Frontend UI** (`src/components`, `src/pages`) — what the user sees and
   clicks. Unchanged in role across every revision.
2. **Supabase** (`src/supabaseClient.js`, real calls from `src/api/api.js` and
   `src/context/AuthContext.jsx`) — a real, hosted backend: Postgres tables
   (`jobs`, `settings`) for data, and Supabase Auth for accounts (hashed
   passwords, real sessions, email/password sign-up and sign-in). This is now
   the **only** thing job data or authentication actually goes through. It
   replaced two things at once: the `localStorage` mock (Revision 2) *and*
   the original abandoned Vercel backend (item 3 below) — the project skipped
   past "resurrect the old custom backend" and went straight to a managed
   BaaS instead.
3. **The original serverless backend** (`api/` at the project root, `db.json`,
   `json-server`) — still exactly as dormant as Revision 2 described, just
   for a different reason now: it isn't merely unused pending a decision, it
   has been decisively bypassed by a different real backend entirely. This is
   now the strongest case yet for actually deleting it (Section 9) rather
   than leaving it as a "maybe someday" artifact — someday already happened,
   and it went a different direction.
4. **The mock layer** (`src/api/mockAuth.js`, `src/api/mockJobs.js`) — what
   *was* the live data path in Revision 2, now fully orphaned. Nothing in
   `src/` imports either file anymore (confirmed by grep). Same "evolved past
   it, never deleted it" pattern flagged in every prior revision, now
   claiming a third victim.

The app is still gated behind a **login wall**, but the mechanism changed:
`App.jsx` now holds its own `authMode` state (`"login"` | `"signup"`) and
renders `LoginPage`/`SignupPage` as two real, separate components — the
Revision 2 pattern of `SignupPage` handling both flows via an internal
`isSignup` toggle is gone, and `LoginPage.jsx` (flagged in Revision 2 as dead
code) is now genuinely wired in and used. Every job row is scoped by a real
`user_id` column filtered server-side by Supabase, replacing the
`user_jobs_<uid>` `localStorage`-key convention — same multi-tenancy intent
as before, now backed by an actual database rather than browser storage that
evaporates if the user clears site data or switches browsers.

---

## 0.1 What Changed Since Revision 2 (the Supabase Migration)

This is a summary for anyone who read Revision 2 and just needs the delta,
before the file-by-file sections below re-describe the affected files in
full.

**Files with real, functional changes (all currently uncommitted):**
- `src/supabaseClient.js` — **new file**, untracked in git. Creates the one
  shared Supabase client via `createClient(url, anonKey)`, reading both from
  Vite env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- `src/context/AuthContext.jsx` — rewritten to call `supabase.auth.signUp`,
  `signInWithPassword`, `signOut`, `getSession`, and subscribe to
  `onAuthStateChange`, instead of calling `MockAuthAPI`.
- `src/api/api.js` — rewritten so `JobAPI` (`list`/`create`/`update`/`remove`)
  issues real `supabase.from("jobs")` queries instead of delegating to
  `MockJobsAPI`. `ThemeAPI` was *also* rewritten to hit a real `settings`
  table — but, as in every previous revision, **nothing calls `ThemeAPI`** —
  theme still persists via `localStorage` directly in `App.jsx`. It went
  from "dead code that would 404 if called" to "dead code that would actually
  work if called" — a smaller problem than before, but still unused.
- `src/App.jsx` — the auth gate now owns `authMode` state directly and
  renders `LoginPage`/`SignupPage` as siblings, rather than `SignupPage`
  owning an internal toggle. `user.uid` became `user.id` everywhere (Supabase
  session users use `.id`, not the `.uid` field name `MockAuthAPI` used).
- `src/pages/LoginPage.jsx` / `SignupPage.jsx` — each now does exactly one
  job (login-only / signup-only) and takes an `onSwitchToLogin`/
  `onSwitchToSignup` prop to hand control back to `App.jsx`. **Revision 2's
  roadmap item 5 ("delete or wire up `LoginPage.jsx`") is done** — it's wired
  up, not deleted.
- `src/components/Header.jsx` — import reorder only (`useContext` folded
  into the main `react` import); no behavioral change. Note `logout` is now
  `async` under the hood (real `supabase.auth.signOut()`) but `Header.jsx`
  still calls it fire-and-forget with no `await`/error handling — see
  Section 7.
- `package.json` — `@supabase/supabase-js` added as a real, used dependency.
  `firebase` and `@vercel/kv` remain installed and still completely unused —
  worth noting that the "unused `firebase` dependency, probably an abandoned
  auth migration" theory from Revision 2 turned out to be directionally
  right (a real-auth migration *was* coming) but landed on a different
  provider than the one already sitting in `package.json`.
- `.env` — **new, untracked, and not covered by `.gitignore`** (which
  currently only lists `node_modules/`). This is a real risk, not a
  hypothetical one: the next `git add .`/`git add -A` in this repo would
  stage real Supabase credentials for commit. See Section 7 and 9 — this is
  the single highest-priority item in this revision.

**Files unchanged by this migration, still exactly as Revision 2 left them:**
`src/api/mockAuth.js`, `src/api/mockJobs.js` (now fully orphaned rather than
partially), the entire `api/` root backend, `db.json`, `KanbanBoard.jsx`,
`Dashboard.jsx`, `Analytics.jsx`, `stats.js`, `JobForm.jsx`,
`StatusTimeline.jsx`, all `.css` files.

**Net effect on the Revision 2 "Weaknesses" list:** the single biggest item
— plaintext passwords with no hashing/salting/rate-limiting — is now
**resolved**, since Supabase Auth owns password storage and hashing entirely.
That was the headline security gap in Revision 2 and it no longer applies.

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

### 2.2 `src/App.jsx` — Auth Gate + Root "Brain" Component (gate rewritten)

**Purpose:** Still two jobs stacked on top of each other, but the gate itself
got smarter:

1. **`App` (the default export)** — the auth gate, now owning its own
   `authMode` state (`"login"` | `"signup"`, defaulting to `"login"`) so it
   can render `LoginPage` or `SignupPage` as two real, separate components
   and hand each a callback to switch to the other. Revision 2's version only
   ever rendered `SignupPage` (which internally handled both flows); that
   internal toggle is gone (Section 2.4/2.5).
2. **`MainApp`** — unchanged role: the central nervous system owning `jobs`,
   `activePage`, selection state, edit state, filters, and theme.

```jsx
export default function App() {
  const { user } = useContext(AuthContext);
  const [authMode, setAuthMode] = useState("login");

  if (!user) {
    return authMode === "login"
      ? <LoginPage onSwitchToSignup={() => setAuthMode("signup")} />
      : <SignupPage onSwitchToLogin={() => setAuthMode("login")} />;
  }
  return <MainApp />;
}
```

**Why this is a better design than Revision 2's internal-toggle approach:**
the decision of "which screen" now lives in exactly one place (`App`), and
both `LoginPage`/`SignupPage` are simple, single-purpose components that
don't need to know about each other's existence beyond the one callback prop
each receives. This is a small, real step toward "screens as routes" without
yet introducing an actual router (Section 7/9).

**Why the Rules-of-Hooks split into `App`/`MainApp` still holds:** unchanged
from Revision 2 — `MainApp` still calls hooks unconditionally at its top
level, so the early-return-before-`MainApp`-mounts pattern still requires two
components, not one with an `if`.

**Imports explained (delta from Revision 2):**

| Import | Why needed | If removed |
|---|---|---|
| `LoginPage` from `./pages/LoginPage.jsx` | Now actually rendered (Section 2.5) — previously imported nowhere | Logged-out users in "login" mode would see nothing |
| `SignupPage` from `./pages/SignupPage.jsx` | Rendered in "signup" mode | Logged-out users couldn't switch to sign up |
| `JobAPI` from `./api/api.js` | Now backed by real Supabase queries (Section 2.6), not `MockJobsAPI` | `MainApp` couldn't load or persist any data |

**Field name change worth flagging explicitly:** every `user.uid` reference
from Revision 2 is now `user.id` — Supabase's session `user` object uses
`.id`, not the `.uid` field name `MockAuthAPI`'s hand-rolled user objects
used. This is a silent, easy-to-miss breaking change if any code elsewhere
still assumed `.uid` — worth grepping for `\.uid\b` across `src/` to confirm
nothing was missed (a quick check during this revision found none, but it's
the kind of rename that's easy to leave half-done).

```js
const { user } = useContext(AuthContext); // inside MainApp too

useEffect(() => {
  if (!user) return; // guards against a stale render before logout finishes
  (async () => {
    setLoading(true);
    const data = await JobAPI.list(user.id);
    setJobs(data);
    ...
  })();
}, [user]);

const handleCreateJob = async (job) => {
  const created = await JobAPI.create(user.id, job);
  ...
};
```

- **Why `[user]` is still a dependency of the load effect:** unchanged
  reasoning from Revision 2 — a different account logging in without a full
  page reload needs this effect to re-run.
- **Why the guard `if (!user) return;` matters more now than it used to:**
  in the `MockJobsAPI` era, calling `JobAPI.list(undefined)` would just read
  a `localStorage` key that happened not to exist and return `[]` — harmless.
  Now it would fire a real Supabase query with `user_id = undefined`, which
  is a real (if brief) wasted network round trip and a query shape a
  security-conscious reviewer would want to double check can't return or
  affect the wrong rows.

**`handleUpdateJob`/`handleDeleteJob`:** Same shape as before; every `JobAPI`
call now takes `user.id`, and multi-tenancy is enforced by Supabase's
`.eq("user_id", ...)` filters rather than a `localStorage` key namespace
(Section 2.6).

**Everything else** (the `filtered` derived list, `toggleTheme`, the
`muiTheme` memo, the JSX composition of `Sidebar`/`Header`/pages, the
Table/Board toggle) is materially unchanged — see Section 4 for the updated
ownership diagram.

**Still true (not fixed):** `query`, `statusFilter`, and `sortBy` exist and
feed the `filtered` computation, but there is still no visible search box or
filter dropdown wired to them anywhere in `MainApp`'s JSX. Flagged in every
revision so far; still an open issue (Section 7).

---

### 2.3 `src/context/AuthContext.jsx` — Global Auth State (rewritten for Supabase)

**Purpose:** Unchanged role — the React Context that makes "who is logged in"
available to any component without prop-drilling. What changed is *what's
behind it*: this now wraps real Supabase Auth instead of `MockAuthAPI`.

**Current shape:**
```js
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const signup = async (email, password) => {
    setError("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); throw error; }
    return data.user;
  };

  const login = async (email, password) => {
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); throw error; }
    return data.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**What genuinely improved over `MockAuthAPI`:**
- **Real session persistence**, not a hand-rolled `current_user` localStorage
  key: `getSession()` reads Supabase's own session storage (a signed JWT), and
  `onAuthStateChange` keeps `user` in sync with token refreshes, expiry, and
  sign-outs that might originate from another tab — none of which
  `MockAuthAPI` could ever do, since it only ever read state once, on mount.
- **Password hashing, salting, and storage are now Supabase's problem, not
  this app's.** The Revision 2 "plaintext password" weakness is fully
  retired — there is no code path left anywhere in this repo that stores or
  compares a raw password.
- **Real error messages from a real provider** (`error.message` from
  Supabase) replace `MockAuthAPI`'s two hardcoded strings (`"User already
  exists"` / `"Invalid email or password"`) — more informative, but also less
  predictable for UI copy, since Supabase's wording isn't under this app's
  control.

**`logout` is now `async` — and every caller still treats it as fire-and-forget.**
`Header.jsx`'s `handleLogout` still just calls `logout()` with no `await` and
no `.catch`. In the `MockAuthAPI` version this was harmless (`logout()` was
synchronous and could not fail). Now it's a real network call to Supabase
that *can* fail (e.g., offline) — if it does, the promise rejection is
currently unhandled, and the UI would look like a logout succeeded (button
click, nothing visibly wrong) when the session might not actually be revoked
server-side. Worth fixing (Section 9).

**Note, unchanged from Revision 2:** `loading` and `error` are still exposed
on the context but **`loading` is still never read anywhere else in the
app** — same theoretical flash-of-login-page on first load, still not
guarded against, now marginally more likely to be visible in practice since
`getSession()` is a real (if usually fast) network/storage round trip rather
than a synchronous `localStorage` read.

**If this file were removed:** `App.jsx`, `Header.jsx`, `SignupPage.jsx`, and
`LoginPage.jsx` would all fail to import `AuthContext` and crash at build
time — unchanged from Revision 2.

---

### 2.4 `src/pages/SignupPage.jsx` — Signup-Only Screen (narrowed)

**Purpose:** No longer dual-purpose. The `isSignup` boolean toggle from
Revision 2 is gone; this component now **only signs up**, and hands control
back to `App.jsx` via a required `onSwitchToLogin` prop instead of flipping
internal state.

**Why the split happened:** `App.jsx` (Section 2.2) now owns `authMode`
itself, so there's no longer a reason for `SignupPage` to also carry
navigation state — the "which screen" decision moved up to the one place
that actually decides which screen renders. This also finally gives
`LoginPage.jsx` a reason to exist as more than dead code (Section 2.5).

**Local state:** `email`, `password`, `error` (still a local copy, still
redundant with `AuthContext`'s `error` — that duplication from Revision 1/2
is unchanged).

**`handleSubmit`:** Now unconditionally `await signup(email, password)` — no
branching. On success, `AuthContext.signup` already called `setUser(...)`
internally, flipping `App.jsx`'s gate to `MainApp`, same mechanism as before.

**Regression to flag:** the demo-credentials hint (`test@example.com` /
`password123`) that Revision 2 displayed under the login-mode view is **gone
along with the login branch** — appropriately, since those are `MockAuthAPI`
seed-account credentials that no longer correspond to any real account in
Supabase. No stale hint was left behind, which is good, but also nothing
replaced it — a first-time visitor now has zero indication whether a demo
account exists in this Supabase project.

**UX/code-quality note, unchanged from Revision 2:** Still entirely
inline-styled `style={{...}}`, unlike every other `.css`-file-styled
page/component in the app (Section 7).

---

### 2.5 `src/pages/LoginPage.jsx` — Now Live (previously orphaned)

**Purpose:** Login-only form, structurally the mirror of `SignupPage.jsx`.
**Revision 2 flagged this file as dead code and recommended deleting it or
wiring it up. It is now wired up** — `App.jsx` renders it directly when
`authMode === "login"`, and it takes an `onSwitchToSignup` prop symmetrical
to `SignupPage`'s `onSwitchToLogin`.

**What changed to make this happen:** `App.jsx` gained `authMode` state and
now imports and conditionally renders both `LoginPage` and `SignupPage` as
siblings (Section 2.2), instead of only ever rendering `SignupPage`. The
component itself needed only one small change to support this — accepting
`onSwitchToSignup` as a prop and rendering a "Sign Up" link that calls it,
mirroring the link `SignupPage` already had.

**Still true:** Still no real router (Section 7/9) — "navigating" between
these two screens is still boolean state in a parent, just one level higher
up than before (`App.jsx` instead of `SignupPage.jsx`). That's a smaller,
more honest version of the same pattern, not a router; the Revision 2/
Section 9 recommendation to eventually add React Router still stands.

**Demo credentials hint still present here:** unlike `SignupPage.jsx`, this
file's JSX still displays `test@example.com` / `password123` — worth
checking whether that account actually exists in the Supabase project now
that `MockAuthAPI`'s auto-seeding no longer runs; if nobody manually created
it in Supabase, this hint is now actively misleading rather than merely
stale.

---

### 2.6 `src/api/api.js` — Real Network Layer Again (rewritten for Supabase)

**Purpose:** Revision 2 described this file as a `MockJobsAPI` delegate. It's
been rewritten a second time, and this time it's not a mock:

```js
import { supabase } from "../supabaseClient";

export const JobAPI = {
  async list(userId) {
    const { data, error } = await supabase.from("jobs").select("*")
      .eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(userId, job) {
    const { data, error } = await supabase.from("jobs")
      .insert([{ ...job, user_id: userId }]).select().single();
    if (error) throw error;
    return data;
  },
  async update(userId, id, partial) {
    const { data, error } = await supabase.from("jobs").update(partial)
      .eq("id", id).eq("user_id", userId).select().single();
    if (error) throw error;
    return data;
  },
  async remove(userId, id) {
    const { error } = await supabase.from("jobs").delete()
      .eq("id", id).eq("user_id", userId);
    if (error) throw error;
    return true;
  },
};

export const ThemeAPI = {
  async get(userId) { /* real supabase.from("settings") query, keyed by user_id */ },
  async set(userId, mode) { /* real supabase.from("settings").upsert(...) */ },
};
```

**What actually changed:** Every `JobAPI` method now issues a real network
request to Supabase's Postgres REST layer, and every method **filters by
`user_id` on both read and write** (`.eq("user_id", userId)`) — the
multi-tenancy guarantee that used to come from a `localStorage` key
namespace (`user_jobs_<uid>`) is now enforced by explicit query filters
instead. **The `JobAPI` facade's public shape didn't change at all** across
this rewrite (`list`/`create`/`update`/`remove`, all still taking `userId`
first) — the same adapter-pattern payoff Revision 2 called out (backend
swapped, callers unchanged) held for a *second* consecutive backend swap,
which is a stronger demonstration of the same lesson than getting it right
once.

**Important nuance this rewrite introduces that `MockJobsAPI` never had:**
client-side `.eq("user_id", userId)` filtering is a convenience, not a
security boundary, unless Supabase **Row Level Security (RLS)** policies on
the `jobs` (and `settings`) tables independently enforce
`auth.uid() = user_id` server-side. That configuration lives in the
Supabase dashboard/SQL, not in this repo, so it can't be verified by reading
source — but it's worth explicitly confirming, because a JS query filter
that a user could bypass by hand-crafting their own request against the same
anon key would defeat the entire multi-tenancy model. This is the single
most important thing to double-check about this migration (Section 7/9).

**`ThemeAPI` was rewritten too, and is now real-but-still-unused.** It
previously did a real `fetch()` to a dead `/api/settings/1` endpoint
(Revision 2's "doubly dead" callout); now it does a real, *working*
`supabase.from("settings")` query. Nothing imports or calls it — same as
every revision before this one. Theme still persists via `localStorage`
directly in `App.jsx`. It went from "would 404 if called" to "would actually
work if called," which is progress, but it's still dead code today.

**If `api.js` were removed:** Same as before — `MainApp` couldn't talk to job
storage at all; its data-load effect would throw.

---

### 2.7 `src/api/mockAuth.js` — `MockAuthAPI` (now fully orphaned, up from "live")

> **Status change this revision:** this was the *live* auth backend as of
> Revision 2. As of the Supabase migration, **nothing in `src/` imports this
> file anymore** — `AuthContext.jsx` calls `supabase.auth.*` directly
> (Section 2.3). The description below is preserved as historical record of
> what this module does; treat it as dead code, not as a description of how
> auth currently works. Recommended action: delete it (Section 9) — keeping
> a fully-featured fake auth backend around next to the real one is a
> concrete liability, not a neutral one: a future developer could import it
> by mistake, or a reader of the code could reasonably mistake it for a
> fallback/offline mode that doesn't actually exist.

**Purpose (historical, no longer live):** A fake authentication backend,
entirely `localStorage`-based, exposing `signup`, `login`, `getCurrentUser`,
and `logout`.

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

### 2.8 `src/api/mockJobs.js` — `MockJobsAPI` (now fully orphaned, up from "live")

> **Status change this revision:** this was the *live* data backend as of
> Revision 2. `src/api/api.js`'s `JobAPI` now delegates to real Supabase
> queries instead (Section 2.6) — nothing imports this file anymore. Kept
> below as historical record; same recommendation as 2.7 (delete it).

**Purpose (historical, no longer live):** A fake per-user job store, entirely
`localStorage`-based.

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

### 2.23 Backend: `api/_lib/store.js`, `api/jobs/*.js`, `api/settings/[id].js` — Legacy, and Now Bypassed Rather Than Pending

**What these files do** is unchanged from earlier revisions' detailed
walkthrough: a KV-or-in-memory storage abstraction (`store.js`), REST
handlers for job CRUD with server-side `statusHistory` management
(`api/jobs/index.js`, `api/jobs/[id].js`), and a settings/theme endpoint
(`api/settings/[id].js`).

**What changed this revision is the meaning of their dormancy, not their
code or their called/not-called status** (they were already fully
uncalled as of Revision 2). Revision 2's Section 9 roadmap posed this as an
open decision: either delete this backend, or resurrect it as the real
persistence layer. **That decision has effectively been made — just not in
either direction Revision 2 anticipated.** Rather than reconnecting
`src/api/api.js` to these Vercel functions, the project adopted Supabase (a
hosted BaaS) instead (Section 2.6). This custom backend was not chosen, not
extended, and not deleted — it now has the weakest possible justification
for existing of any point in this project's history: it isn't even the
leading candidate for "the real backend" anymore if one were needed, since a
real backend already exists elsewhere.

**Why Supabase over resurrecting this code was a reasonable call, worth being
able to explain in an interview:** Supabase gives real Postgres, real hosted
auth (hashing, sessions, email flows), and Row Level Security out of the
box, without hand-rolling and hosting a KV-backed REST API and a separate
auth system. The custom `api/` backend's one genuine advantage —
already-correct server-side `statusHistory` enforcement (Section 2.8/2.11)
— did **not** carry over: that business rule is still built entirely
client-side (`JobForm.jsx`, `KanbanBoard.jsx`) and handed to Supabase as
plain columns/JSON on insert/update, with nothing server-side (e.g., a
Postgres trigger or function) re-verifying it. That's a real, if narrow,
regression opportunity worth knowing about even though it isn't new to this
revision — it was already true under `MockJobsAPI`, and remains true under
Supabase.

**Recommendation, sharper than Revision 2's:** delete `api/`, `db.json`, and
the `json-server` devDependency outright (Section 9). There is no longer a
plausible future where this codebase reconnects to them — that fork in the
road already resolved in Supabase's favor.

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

### 3.0 Sign Up (rewritten for Supabase)

```
User lands on the app, not logged in → App.jsx: user is null, authMode="login" → renders <LoginPage/>
User clicks "Sign Up" link → App.jsx: setAuthMode("signup") → <SignupPage/> renders instead
User fills email/password → clicks "Sign Up" → SignupPage.handleSubmit → AuthContext.signup(...)
    → supabase.auth.signUp({ email, password })
       → Supabase hashes/stores the password server-side, creates a real auth.users row,
         may send a confirmation email depending on the Supabase project's email-confirmation setting
       → on error: setError(error.message); throw  (SignupPage shows it inline)
       → on success: returns data.user
    → onAuthStateChange fires (Supabase's own event, not this app's code) → AuthContext: setUser(session.user)
 → App.jsx re-renders: user is now truthy → LoginPage/SignupPage unmount, <MainApp/> mounts
 → MainApp's load effect fires ([user] dependency) → JobAPI.list(user.id)
    → real supabase.from("jobs").select("*").eq("user_id", user.id) → likely [] for a brand-new account
 → user lands on an empty Dashboard, ready to add their first job
```
**Nuance not present in the Revision 2 mock flow:** if the Supabase project
has email confirmation enabled (the default on a new Supabase project), a
freshly signed-up user's session may not be immediately active — `data.user`
can come back non-null while `onAuthStateChange`/`getSession` still report
no active session until the confirmation link is clicked. Worth manually
verifying which behavior this specific project is configured for, since it
directly affects whether "sign up" instantly logs someone in (as the mock
always did) or requires an extra step now.

### 3.0b Log In (rewritten for Supabase)

```
User on <LoginPage/> (authMode="login", the default) → fills email/password → clicks "Login"
 → AuthContext.login(email, password) → supabase.auth.signInWithPassword({ email, password })
    → real error message from Supabase if credentials are wrong (not a fixed app string anymore)
    → on success: writes a real session (JWT), returns data.user
 → onAuthStateChange fires → AuthContext: setUser(session.user)
 → App.jsx re-renders: LoginPage unmounts, <MainApp/> mounts, same as signup above
    → MainApp fetches THIS user's jobs via supabase.from("jobs").eq("user_id", user.id)
```

### 3.0c Log Out (rewritten for Supabase — now genuinely async)

```
User clicks "Logout" (Header.jsx, no confirmation dialog — unchanged gap from Revision 2)
 → Header calls logout() WITHOUT awaiting it or catching a rejection
 → AuthContext.logout() → await supabase.auth.signOut()  (a real network call — can fail, e.g. offline)
    → on success: revokes the session server-side, then setUser(null)
    → on failure: the promise rejects; nothing in Header.jsx observes this — the UI proceeds
      as if logout succeeded regardless (Section 7 — worth fixing)
 → App.jsx re-renders (once setUser(null) actually runs): user is null →
   MainApp unmounts entirely, LoginPage mounts (authMode resets to its default, "login")
 → Next login re-fetches fresh from Supabase — no data was lost, only in-memory React state
```

### 3.1 Create Job (real network call, still no error handling)

```
User clicks "Add Job" (Header) → Header: setOpen(true) → JobForm opens (jobToEdit = null → "create mode")
 → User fills fields → JobForm.handleChange updates local `form` state on every keystroke
 → User clicks "Save" → JobForm.handleSubmit
    → validateAndNormalizeUrl(form.link)
    → if valid: builds `job` object with a new crypto.randomUUID(), including an initial statusHistory entry
    → calls onCreate(job)  [prop chain: JobForm → Header → MainApp.handleCreateJob — NO try/catch anywhere in this chain]
       → MainApp.handleCreateJob: await JobAPI.create(user.id, job)
          → real supabase.from("jobs").insert([{ ...job, user_id: user.id }]) — a genuine network round trip
       → setJobs(prev => [created, ...prev])
    → React re-renders MainApp and all children that read `jobs` (Dashboard/Analytics/Settings/JobList/KanbanBoard)
 → JobForm closes, form resets to blank defaults
```
**Delta from Revision 2, and a real new risk:** Revision 2 correctly noted
this used to be fully synchronous with nothing that could fail. **That is no
longer true, and the error-handling code did not catch up.** `JobAPI.create`
throws on any Supabase error (network drop, RLS policy rejecting the insert,
a constraint violation) — and neither `MainApp.handleCreateJob`,
`Header.jsx`, nor `JobForm.jsx`'s `handleSubmit` wraps this call in
`try`/`catch` anywhere in the chain. Concretely: if this insert fails, the
`await` throws, `setJobs` never runs, but there is nothing that catches the
rejection either — the promise simply rejects unhandled. Depending on the
browser this can silently do nothing visible, or log an uncaught error to
the console that the user never sees; either way, `JobForm` may not close,
there's no error message shown, and the user has no idea whether their job
was saved. This is the most concrete, fixable gap this migration introduced
(Section 7/9) — it's exactly the "server can now say no" case a purely
client-side mock never had to handle.

### 3.2 Edit Job (same unhandled-error gap)

Same sequence as before (row select → Edit button → `isEditing`/`editingJob`
→ modal opens pre-filled → status-change-date field appears conditionally →
Save), except the final persistence step now hits a real backend with the
same missing error handling as 3.1:
```
onUpdate(jobToEdit.id, partial) → MainApp.handleUpdateJob(id, partial)
  → await JobAPI.update(user.id, id, partial) → real supabase.from("jobs").update(partial)
    .eq("id", id).eq("user_id", user.id) — no server-side statusHistory enforcement (Section 2.23)
  → setJobs(prev => prev.map(j => j.id === id ? updated : j))
  → onCancelEdit()
```
Same caveat as 3.1: no `try`/`catch` around `handleUpdateJob`'s `await`.

### 3.3 Delete Job

Same shape, `JobAPI.remove(user.id, id)` → real
`supabase.from("jobs").delete().eq("id", id).eq("user_id", user.id)` — a
genuine network call that can fail, again with no `try`/`catch` anywhere in
`handleDeleteJob`'s call chain.

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

## 7. Engineering Assessment (Revision 3 — reassessed post-Supabase-migration)

**Strengths**
- **The single biggest weakness in every prior revision — no real backend —
  is now resolved.** Real Postgres, real hosted auth with password hashing,
  real sessions. This is the one change with the most leverage on how this
  project reads to an outside reviewer, more than any UI or feature work
  could have delivered on its own.
- **The `JobAPI` facade earned its keep for a second time.** Revision 2
  already noted the adapter pattern paid off once (real HTTP → mock). It
  just paid off again in the other direction (mock → real Supabase) with
  zero changes required in any calling component. Two consecutive backend
  swaps behind one stable interface is a genuinely strong, repeatable
  demonstration of *why* this abstraction exists — worth stating plainly in
  an interview, since it's rare for a portfolio project to actually
  exercise a design pattern's payoff twice.
- **`LoginPage.jsx`, flagged as dead code in Revision 2, is now live** — the
  fix took the form of a real design decision (`App.jsx` owning `authMode`)
  rather than the two options Revision 2 assumed ("delete it" or "add a
  router"). This is evidence of solving the *actual* problem (two screens
  need to coexist and hand off control) rather than mechanically satisfying
  a checklist item.
- **Multi-tenancy moved from a convention to an enforced query filter** —
  `user_jobs_<uid>` (a `localStorage` key nobody could violate only because
  nothing else read that browser's storage) became `.eq("user_id", userId)`
  server-side filtering, which is the correct direction to move in even
  though (see Weaknesses) it still needs RLS to be a real guarantee rather
  than a client-side courtesy.
- **State-ownership model held up across a third architectural change in a
  row** (real backend → mock → real backend again) without `MainApp` needing
  to be restructured each time — the separation between "who owns UI state"
  and "how is data persisted" that was set up early is still paying off.

**Weaknesses**
- **New, concrete, and the top priority: `.env` is untracked but not
  gitignored.** `.gitignore` currently only lists `node_modules/`. The
  Supabase URL and anon key currently sit in a file one `git add .`/`git add
  -A` away from being committed and pushed to a public GitHub repo. The anon
  key is designed to be public-safe *only if RLS is correctly configured*
  (next point) — until that's confirmed, treat this as a real credential
  exposure risk, not a style nit. Fix: add `.env` to `.gitignore` before the
  next commit, and rotate the keys if `.env` was ever already committed in
  an earlier commit (check `git log --all --full-history -- .env`).
- **Row Level Security on the `jobs`/`settings` tables cannot be verified
  from this repo** — it's a Supabase-dashboard/SQL concern, not client code.
  `src/api/api.js`'s `.eq("user_id", userId)` filters are a correct and
  necessary *client-side* convenience, but they are not a security boundary
  by themselves: anyone with the anon key (which, per the point above, is
  currently one accidental commit away from being public) could otherwise
  query `jobs` with a different `user_id` unless RLS policies independently
  enforce `auth.uid() = user_id` on every table. This is the single most
  important thing to manually confirm in the Supabase dashboard before
  calling this migration "done" from a security standpoint.
- **New, concrete, and directly caused by this migration: zero error
  handling on any Supabase write.** `handleCreateJob`, `handleUpdateJob`, and
  `handleDeleteJob` in `App.jsx`, and every step of the prop chain from
  `JobForm.jsx`/`Header.jsx` down to them, have no `try`/`catch` anywhere
  (Section 3.1–3.3). Under `MockJobsAPI` this was never reachable — a
  `localStorage` write basically cannot fail. Under Supabase it very much
  can (RLS denial, network drop, constraint violation), and right now a
  failure produces a silently unhandled promise rejection: no error message,
  a modal that may not close, and no way for the user to know their data
  wasn't saved. This is the most impactful, most fixable item in this
  revision (Section 9).
- **`AuthContext.logout` is `async` now but `Header.jsx` still calls it
  fire-and-forget**, with no `await` and no `.catch` — same unhandled-
  rejection shape as the point above, applied to sign-out instead of data
  writes.
- **Two now-fully-orphaned files, not partially, as before:**
  `mockAuth.js`/`mockJobs.js` were the *live* path in Revision 2; now nothing
  imports either. This is the same "evolved past it, never deleted it"
  pattern the doc has flagged at every revision so far, now claiming its
  third and fourth victims (on top of the still-dormant `api/` backend and
  the still-unused `firebase` dependency, both carried over unresolved from
  Revision 2 — see below).
- **Carried over, unresolved from Revision 2 (nobody has acted on these
  yet):** the entire `api/` backend + `db.json` + `json-server` remain
  installed and dormant (Section 2.23, now with a sharper case for deletion
  than before); the unused `firebase` dependency is still in `package.json`;
  Search/Filter UI is still wired in state but never rendered; no
  server-side *or* client-side shape validation beyond `JobForm`'s HTML
  `required` attributes (now more consequential than before, since
  malformed writes go to a real, persistent database instead of disposable
  `localStorage`); Logout still has no confirmation dialog; the auth screens
  are still inline-styled rather than using the app's CSS-variable theming;
  Analytics' monthly chart still lacks a chronological sort; the "Response
  Rate"/"Offer Rate" duplicate-metric bug (Section 2.15) is still present;
  duplicated `COLORS`/`KPI` definitions across three components; `.jsx` on
  the non-JSX `validation.jsx`; CSV export's unescaped-quote bug; blocking
  native `alert()` in `exportCsv.js`. None of this list is new — it's
  reproduced here so a reader of this revision alone doesn't lose track of
  what's still open.

**Scalability concerns**

This is the one area where the migration is an unambiguous, complete win:
every scalability caveat Revision 2 raised about `localStorage`
(write-amplification on every mutation, a hard ~5–10MB per-origin size
ceiling, data trapped in one browser profile) is resolved by moving to
Postgres. The new scalability profile is whatever Supabase's own free/paid
tier limits are — a normal, expected constraint for a real hosted database,
not a self-inflicted architectural one.

**Code quality / maintainability review**

The same "moves fast on feature work, doesn't always do a final
consolidation pass" pattern the doc has now identified across three
consecutive revisions repeated again here: two more orphaned files
(`mockAuth.js`, `mockJobs.js`) joined the pile, and the error-handling gap
around Supabase calls suggests the migration was verified against the
happy path (login works, jobs load, jobs save) without a deliberate pass
asking "what happens when Supabase says no?" That said, the actual
migration code itself (`api.js`, `AuthContext.jsx`) is clean, readable, and
correctly scoped — the gap is what *didn't* get touched (error boundaries,
`.gitignore`, deleting the mocks) rather than quality problems in what did.

**UI/UX review**

Unchanged from Revision 2's read — the stale-application badge and
role/time-based analytics remain the strongest UX ideas in the app.
Nothing about the Supabase migration itself is user-visible when things go
right; the new user-visible risk is entirely on the failure path (Weaknesses,
above) — a network hiccup during a save now has no visible feedback at all,
where previously (mock era) that failure mode literally could not occur.

**Architecture review**

The most important architectural fact changed for the first time since
Revision 1: **this app now has a real server dependency at runtime again.**
Revision 2's framing — "your data is really just this browser profile's
data" — no longer applies; data now lives in Supabase, survives a cleared
browser, and is reachable from any device the user logs into. That is a
genuine upgrade in what this project can honestly claim to be. The
remaining architectural question is no longer "should this get a real
backend" (answered) but "is the real backend correctly locked down"
(RLS, above) and "does the app degrade gracefully when that backend is
unreachable" (error handling, above) — both now open, both now answerable
with concrete, scoped fixes rather than a rewrite.

---

## 8. Skill Assessment (Revision 3)

Based on this codebase, the developer continues to demonstrate skills
consistent with **Strong Junior, trending toward Mid-Level** — the same band
as Revision 2 — but this migration is the strongest single piece of evidence
yet in favor of the "trending" half of that label, specifically because it
tackles the exact gap (no real backend) that most separates a portfolio
project from something resembling production software.

**New evidence supporting the "trending mid-level" read:**
- **Independently executed a real backend migration** — not "added a
  feature," but swapped both the auth provider and the data layer to a
  hosted service, correctly re-pointed every call site, and did it without
  breaking the `JobAPI`/`AuthContext` interfaces the rest of the app depends
  on. This is qualitatively different work from feature-level changes seen
  in earlier revisions.
- **Recognized that a facade/adapter should survive a second backend swap**
  — `JobAPI`'s public shape held constant across real-HTTP → mock →
  real-Supabase. That's not luck; it's the direct payoff of a design
  decision made early and respected consistently.
- **Solved the `LoginPage.jsx` dead-code problem with an actual design
  decision** (`authMode` lifted to `App.jsx`) rather than just deleting the
  file to make a lint warning go away — shows it was treated as a UX problem
  to solve, not a checklist item to clear.
- **Chose a managed backend (Supabase) over resurrecting a half-built custom
  one** (Section 2.23) — recognizing that "the code already exists" isn't a
  strong enough reason to extend it when a better-fit tool is available is a
  genuinely mid-level judgment call, not a junior one.

**Evidence still consistent with "not yet senior":**
- **The exact failure mode a senior engineer is trained to ask about first —
  "what happens when this network call fails?" — has no answer anywhere in
  the create/update/delete/logout call chains** (Section 7). This is the
  single clearest signal in this revision: the migration was validated
  against the happy path, and the question of backend failure wasn't asked
  before merging.
- **A credential-hygiene gap that a senior reviewer would flag before
  anything else in this diff:** `.env` sitting untracked-but-not-ignored
  (Section 7) is a five-minute fix, but the fact that it wasn't caught
  before this analysis suggests the habit of checking `git status` /
  `.gitignore` coverage before introducing new secret-bearing files isn't
  fully automatic yet.
- **The same "migrate, don't clean up" pattern from every prior revision
  repeated again** — `mockAuth.js`/`mockJobs.js` joined `LoginPage.jsx`
  (now resolved) and the dormant `api/` backend and unused `firebase`
  dependency (both still unresolved from Revision 2) as accumulated dead
  weight. Four instances of the same pattern across three revisions is
  enough to call it a habit rather than a one-off.
- **Whether Row Level Security is actually configured cannot be verified
  from the code** (Section 7) — and there's no evidence in this codebase
  (no SQL migration files, no comment, no README mention) that it was
  deliberately checked and confirmed, as opposed to assumed. A senior
  engineer would treat "does the server independently enforce this" as a
  mandatory checkbox before calling an auth migration complete, not an
  optional afterthought.

---

## 9. Improvement Roadmap (Revision 3)

**High Impact**
1. **Add `.env` to `.gitignore` immediately, before any further commits.**
   This is a five-minute fix and the single highest-priority item in this
   revision (Section 7). If `.env` was ever staged or committed previously,
   check `git log --all --full-history -- .env` and rotate the Supabase
   keys if so.
2. **Add error handling to every Supabase write path** — `handleCreateJob`,
   `handleUpdateJob`, `handleDeleteJob` in `App.jsx`, and `AuthContext`'s
   `logout` (Section 7). At minimum, `try`/`catch` around each `await` and
   an error state surfaced to the user (reusing the existing `error` state/
   `state-msg error` styling already used for the initial load failure would
   be the smallest correct fix — it already exists in `App.jsx`, it's just
   not reused here).
3. **Confirm Row Level Security is enabled and correct** on the `jobs` and
   `settings` tables in the Supabase dashboard (`auth.uid() = user_id` on
   select/insert/update/delete). This can't be checked from this repo, which
   is exactly why it needs a deliberate, documented check rather than an
   assumption.
4. **Delete `src/api/mockAuth.js` and `src/api/mockJobs.js`.** Both are now
   fully unreferenced dead code (Section 2.7/2.8) — same recommendation
   Revision 2 made about `LoginPage.jsx`, which *was* acted on; these two
   files are the next overdue instance of the same cleanup.
5. **Decide the fate of the dormant `api/` backend, `db.json`, and
   `json-server`** — Revision 2 posed this as an open choice; that choice
   has now effectively been made in Supabase's favor (Section 2.23), which
   makes "delete it" the clear answer rather than a coin flip. Nothing about
   this migration benefits from keeping it around any longer.
6. **Fix the Analytics "Response Rate" / "Offer Rate" duplicate-metric bug**
   — unresolved, carried over from Revision 2 (Section 7).
7. **Restore chronological ordering to the "Applications by Month" chart**
   — unresolved, carried over from Revision 2.

**Medium Impact**
8. **Add automated tests** — this recommendation gets meaningfully more
   valuable post-migration, not less: Revision 2 framed this around
   `utils/stats.js`'s pure-function edge cases, which still stands, but now
   there's a second, arguably higher-value target — `src/api/api.js`'s
   Supabase queries and `AuthContext`'s auth flows are exactly the kind of
   real-network-boundary code that silently breaks without tests (a typo in
   a `.eq()` filter, for instance, could leak or hide rows with no visible
   symptom in normal manual testing). Vitest + React Testing Library, per
   the original recruiter-style critique this revision responds to
   (Section 10).
9. **Client-side shape validation before every Supabase write** (zod/yup, as
   the critique in Section 10 suggests) — more consequential now than under
   `MockJobsAPI`, since a malformed write now persists in a real, shared
   database rather than disposable `localStorage`.
10. **Wire up (or remove) Search and Status Filter UI** — unchanged,
    unresolved since Revision 1.
11. **Deduplicate status colors/KPI components** — unchanged, unresolved.
12. **Add a confirmation step to Logout** — unchanged, unresolved, and
    marginally more important now that logout is a real network call that
    can be slow or fail (Section 7).
13. **React Router** — unchanged recommendation; would let the
    `LoginPage`/`SignupPage` split (already improved this revision) become
    real, linkable routes instead of `authMode` state in `App.jsx`.

**Low Impact**
14. **Style the auth pages consistently** with the app's CSS-variable
    theming — unchanged, unresolved.
15. **TypeScript** — unchanged recommendation.
16. **File attachments**, **richer analytics** (per-week application rate,
    average response delay — both named in the Section 10 critique) —
    natural next steps now that data lives somewhere durable enough to make
    week-over-week trends meaningful.
17. **Activity feed / Notifications** — unchanged, unresolved.
18. **Feature-folder / hooks refactor** (`useJobs`, `useAuth`, `services/`)
    — `App.jsx`'s `MainApp` is still one large component owning most of the
    app's state; extracting data-fetching into custom hooks would be a
    natural next step now that the data layer itself (Supabase) is settled
    and less likely to change again soon.

---

## 10. Reconciling an External Critique Against Current Reality

An external, recruiter-style review of this project was received and read
alongside this migration. It's reproduced here point-by-point against what
the code actually shows today, because several of its claims were accurate
about an earlier state of this repo but are no longer accurate now, and it's
worth being precise about which is which rather than treating the critique
as either fully right or fully outdated.

**Claims the critique made that were already false by the time it was
written (i.e., features it suggested already existed):**
- *"Add a Kanban board — Applied/Interview/Offer/Rejected as draggable
  columns."* `KanbanBoard.jsx` already existed using `@hello-pangea/dnd`,
  documented since Revision 1/2 of this file (Section 2.13). Toggle between
  Table/Board view is a first-class part of the Applications page
  (`App.jsx`'s `view` state).
- *"Even fake auth — login, protected routes, session persistence — changes
  perception."* Auth already existed as of Revision 2 (mocked), and as of
  this revision is **real** Supabase Auth, which exceeds what the critique
  asked for.

**Claims that were true when written and are now resolved by this
migration:**
- *"No real backend credibility... looks like a frontend app pretending to
  be fullstack."* This was the single most accurate criticism in the
  document, and it's the one this migration directly targets: real API
  persistence (Postgres via Supabase) and real auth are both in place now.
  What the critique asked for under this heading that is **still missing**:
  optimistic updates, and retry/graceful-failure handling — see the "not yet
  resolved" list below, since these map directly onto the unhandled-
  rejection gap in Section 7.

**Claims that remain true and unaddressed:**
- *"Missing testing = missing trust."* Still zero automated tests anywhere
  in this repo. This is arguably **more** true post-migration than before:
  a test suite around `JobAPI`/`AuthContext` would catch a Supabase query or
  auth-flow regression that manual clicking-through easily misses (Section
  9, item 8).
- *"Your validation is too thin... add zod or yup."* Still only
  `validateAndNormalizeUrl` plus HTML `required` attributes. More
  consequential now than when the critique was written, since bad writes
  now land in a real, persistent, shared database (Section 9, item 9).
- *"Real analytics — applications/week, response rate, average response
  delay, interview conversion rate."* Partially true as a gap: interview
  conversion rate and a "best month" metric already existed before this
  migration (Section 2.20); per-week application rate and average response
  delay genuinely do not exist yet (Section 9, item 16).
- *"Too much logic inside App.jsx... custom hooks, feature folders, service
  layer."* Still accurate — if anything, `MainApp` picked up more
  responsibility this revision (auth-aware data loading, `authMode` in the
  parent `App`), not less (Section 9, item 18).
- *"Mobile UX polish."* Not assessable from source alone — this requires
  actually opening the running app on a small viewport, which this analysis
  did not do. Flagging it as genuinely unverified rather than confirming or
  denying it.

**One thing worth saying plainly:** the critique's framing — "good learning
project" vs. "someone we can trust inside production" — was a fair
description of the state it was reviewing. The gap it centers on
architecture: no real backend, no tests, thin validation is a coherent,
correctly-prioritized list, and this migration closed the largest single
item on it. The two next highest-leverage moves, in order, are the ones
this revision's own analysis converged on independently: (1) error handling
around the now-real network calls, because a backend that can fail and
silently doesn't tell anyone is arguably a worse look in a live demo than no
backend at all, and (2) an automated test suite, for exactly the reason the
critique gave — it's the concrete, verifiable signal that separates "I got
it working" from "I know it keeps working."
