// src/App.jsx
import React, { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import JobForm from "./components/JobForm.jsx";
import JobList from "./components/JobList.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { JobAPI, ThemeAPI } from "./api.js";

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // theme mode loaded from API
  const [mode, setMode] = useState("dark");
  const [themeLoading, setThemeLoading] = useState(true);

  // Load theme preference from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setThemeLoading(true);
        const data = await ThemeAPI.get(); // expects { mode: "light" | "dark" }
        if (!cancelled && (data?.mode === "light" || data?.mode === "dark")) {
          setMode(data.mode);
        }
      } catch (e) {
        // fallback to dark on failure
        setMode("dark");
      } finally {
        if (!cancelled) setThemeLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Reflect theme on <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  // Load jobs once
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

  // CRUD handlers
  const handleCreateJob = async (job) => {
    const created = await JobAPI.create(job);
    setJobs((prev) => [created, ...prev]);
  };

  const handleUpdateJob = async (id, partial) => {
    const updated = await JobAPI.update(id, partial);
    setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
  };

  const handleDeleteJob = async (id) => {
    await JobAPI.remove(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (selectedJobId === id) setSelectedJobId(null);
  };

  const onCancelEdit = () => {
    setIsEditing(false);
    setEditingJob(null);
  };

  // Toggle theme and persist to API (optimistic update)
  const toggleTheme = async () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    try {
      await ThemeAPI.set(next);
    } catch (e) {
      // revert on failure
      setMode(mode);
      alert("Failed to update theme: " + (e?.message || "unknown error"));
    }
  };

  return (
    <div className="app">
      <Header
        onCreate={handleCreateJob}
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
        onUpdate={async (id, partial) => {
          await handleUpdateJob(id, partial);
          onCancelEdit();
        }}
        themeMode={mode}
        onToggleTheme={toggleTheme}
      />

      {(loading || themeLoading) && <p style={{ padding: 16 }}>Loading…</p>}
      {error && <p style={{ padding: 16, color: "crimson" }}>{error}</p>}

      {!loading && !themeLoading && !error && (
        <>
          <Dashboard jobs={jobs} />

          <main style={{ marginTop: 12 }}>
            <JobList
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelect={setSelectedJobId}
            />
          </main>
        </>
      )}

      {/* Optional: inline editor if you use it here; otherwise Header handles forms */}
      {isEditing && editingJob && (
        <JobForm
          initial={editingJob}
          onCancel={onCancelEdit}
          onSubmit={(data) => handleUpdateJob(editingJob.id, data)}
        />
      )}
    </div>
  );
}
