// src/App.jsx
import React, { useEffect, useState } from "react";
import "./styles/App.css";

import Header from "./components/Header.jsx";
import JobList from "./components/JobList.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Analytics from "./components/Analytics.jsx";
import Settings from "./components/Settings.jsx";
import Sidebar from "./components/Sidebar";

import { JobAPI } from "./api.js";

export default function App() {
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

  const [mode, setMode] = useState(
    () => localStorage.getItem("theme") ?? "dark"
  );

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  // Load jobs
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
      statusFilter === "All"
        ? true
        : j.status === statusFilter
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

  return (
    
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

          const job = jobs.find(
            (j) => j.id === selectedJobId
          );

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
        themeMode={mode}
        onToggleTheme={toggleTheme}
      />

      {loading && (
        <p style={{ padding: 16 }}>Loading...</p>
      )}

      {error && (
        <p
          style={{
            padding: 16,
            color: "crimson",
          }}
        >
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          {activePage === "dashboard" && (
            <Dashboard jobs={jobs} />
          )}

          {activePage === "applications" && (
            <>
              <div className="filters">
                <input
                  className="search-input"
                  type="search"
                  placeholder="Search company or title..."
                  value={query}
                  onChange={(e) =>
                    setQuery(e.target.value)
                  }
                />

                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  {[
                    "All",
                    "Applied",
                    "Interviewing",
                    "Offer",
                    "Rejected",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                >
                  <option value="newest">
                    Newest first
                  </option>

                  <option value="oldest">
                    Oldest first
                  </option>
                </select>
              </div>

              <main>
                <JobList
                  jobs={filtered}
                  selectedJobId={selectedJobId}
                  onSelect={setSelectedJobId}
                />
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
  );
}