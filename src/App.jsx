import React, { useEffect, useMemo, useState, useContext } from "react";
import "./styles/App.css";
import { ThemeProvider, CssBaseline } from "@mui/material";
import createAppTheme from "./theme.js";
import KanbanBoard from "./components/KanbanBoard.jsx";
import Header from "./components/Header.jsx";
import JobList from "./components/JobList.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Analytics from "./components/Analytics.jsx";
import Settings from "./components/Settings.jsx";
import Sidebar from "./components/Sidebar";
import { AuthContext } from './context/AuthContext';
import { JobAPI } from "./api/api.js";
import { SignupPage } from './pages/SignupPage';

export default function App() {
  // CHECK IF USER IS LOGGED IN FIRST
  const { user } = useContext(AuthContext);

  // If NOT logged in, show login page only
  if (!user) {
  return <SignupPage />;
  }

  // If logged in, show the rest of the app
  return <MainApp />;
}

// All your app logic in a separate component
function MainApp() {
    const { user } = useContext(AuthContext);  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState("table");
  const [mode, setMode] = useState(
    () => localStorage.getItem("theme") ?? "dark"
  );

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  // Load jobs
  useEffect(() => {
  if (!user) return;  // Don't fetch if no user
  
  (async () => {
    try {
      setLoading(true);
      const data = await JobAPI.list(user.uid);  // ← Pass user.uid
      setJobs(data);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  })();
}, [user]);  // ← Add user as dependency

  // CREATE
  const handleCreateJob = async (job) => {
    const created = await JobAPI.create(job);
    setJobs((prev) => [created, ...prev]);
  };

  // UPDATE
  const handleUpdateJob = async (id, partial) => {
    const updated = await JobAPI.update(id, partial);
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? updated : j))
    );
  };

  // DELETE
  const handleDeleteJob = async (id) => {
    await JobAPI.remove(id);
    setJobs((prev) =>
      prev.filter((j) => j.id !== id)
    );
    if (selectedJobId === id) {
      setSelectedJobId(null);
    }
  };

  // CANCEL EDIT
  const onCancelEdit = () => {
    setIsEditing(false);
    setEditingJob(null);
  };

  // FILTERING
  const filtered = jobs
    .filter((j) =>
      [j.company, j.title].some((v) =>
        v.toLowerCase().includes(query.toLowerCase())
      )
    )
    .filter((j) =>
      statusFilter === "All" ? true : j.status === statusFilter
    )
    .sort((a, b) =>
      sortBy === "newest"
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );

  // THEME TOGGLE
  const toggleTheme = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("theme", next);
  };

  const muiTheme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="layout">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
        />
        <div className="main-content">
          <Header
            jobs={jobs}
            onCreate={handleCreateJob}
            onUpdate={async (id, partial) => {
              await handleUpdateJob(id, partial);
              onCancelEdit();
            }}
            onEdit={() => {
              if (!selectedJobId) return;
              const job = jobs.find((j) => j.id === selectedJobId);
              if (!job) return;
              setEditingJob(job);
              setIsEditing(true);
            }}
            onDelete={() => {
              if (!selectedJobId) return;
              handleDeleteJob(selectedJobId);
            }}
            onCancelEdit={onCancelEdit}
            canEdit={Boolean(selectedJobId)}
            canDelete={Boolean(selectedJobId)}
            isEditing={isEditing}
            editingJob={editingJob}
            activePage={activePage}
            themeMode={mode}
            onToggleTheme={toggleTheme}
          />

          <div className="page">
            {loading && (
              <p className="state-msg">Loading your applications…</p>
            )}

            {error && (
              <p className="state-msg error">{error}</p>
            )}

            {!loading && !error && (
              <>
                {activePage === "dashboard" && (
                  <Dashboard jobs={jobs} />
                )}

                {activePage === "applications" && (
                  <>
                    <div className="filters">
                      <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => setView("table")}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            border: "1px solid var(--card-border)",
                            background: view === "table" ? "var(--primary)" : "var(--card-bg)",
                            color: view === "table" ? "#fff" : "var(--fg)",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          Table
                        </button>
                        <button
                          onClick={() => setView("board")}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            border: "1px solid var(--card-border)",
                            background: view === "board" ? "var(--primary)" : "var(--card-bg)",
                            color: view === "board" ? "#fff" : "var(--fg)",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          Board
                        </button>
                      </div>
                    </div>

                    <main>
                      {view === "table" ? (
                        <JobList
                          jobs={filtered}
                          selectedJobId={selectedJobId}
                          onSelect={setSelectedJobId}
                        />
                      ) : (
                        <KanbanBoard
                          jobs={filtered}
                          onUpdate={handleUpdateJob}
                        />
                      )}
                    </main>
                  </>
                )}

                {activePage === "analytics" && (
                  <Analytics jobs={jobs} />
                )}

                {activePage === "settings" && (
                  <Settings
                    mode={mode}
                    onToggleTheme={toggleTheme}
                    jobs={jobs}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}