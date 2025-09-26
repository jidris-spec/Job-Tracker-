import React from "react";
import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import JobForm from "./components/JobForm.jsx";
import JobList from "./components/JobList.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { JobAPI } from "./api.js";

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

 // useEffect Load jobs using async IIFE (Immediately Invoked Function Expression)
 // it ended with [] to run only once
  React.useEffect(() => { 
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

  const handleCreateJob = async (job) => {
    try {
      const created = await JobAPI.create(job);
      setJobs((prev) => [created, ...prev]);
    } catch (e) {
      alert("Create failed: " + e.message);
    }
  };

  const handleUpdateJob = async (id, partial) => {
    try {
      const updated = await JobAPI.update(id, partial);
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updated } : j)));
    } catch (e) {
      alert("Update failed: " + e.message);
    }
  };

  const handleDeleteJob = async (id) => {
    try {
      await JobAPI.remove(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (error) return <p style={{ padding: 16, color: "crimson" }}>{error}</p>;

  return (
    <>
      <Header
        jobs={jobs}
        onCreate={handleCreateJob}
        onEdit={() => {
          if (!selectedJobId) return;
          const job = jobs.find((j) => j.id === selectedJobId);
          if (!job) return;
          setEditingJob(job);
          setIsEditing(true);
        }}
        onCancelEdit={() => {
          setIsEditing(false);
          setEditingJob(null);
        }}
        onUpdate={async (id, partial) => {
          await handleUpdateJob(id, partial);
          setIsEditing(false);
          setEditingJob(null);
        }}
        isEditing={isEditing}
        editingJob={editingJob}
        onDelete={() => selectedJobId && handleDeleteJob(selectedJobId)}
        canEdit={Boolean(selectedJobId)}
        canDelete={Boolean(selectedJobId)}
      />

    <Dashboard jobs={jobs} />
      <JobList jobs={jobs} selectedJobId={selectedJobId} onSelect={setSelectedJobId} />
    </>
  );
}

export default App;