
import React from "react";
import Header from "./components/Header";
import JobList from "./components/JobList";


function App() {
 
  const [jobs, setJobs] = React.useState(() => {
    const saved = localStorage.getItem("jobs");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedJobId, setSelectedJobId] = React.useState(null);
  React.useEffect(() => {
    localStorage.setItem("jobs", JSON.stringify(jobs));
  }, [jobs]);

  const handleCreateJob = (job) => {
    setJobs((prev) => [job, ...prev]);
  };
  const handleDelete = () => {
    if (!selectedJobId) return;
    setJobs((prev) => prev.filter((j) => j.id !== selectedJobId));
    setSelectedJobId(null);
  };

  return (
    <>
      <Header
        onCreate={handleCreateJob}
        onEdit={() => {
          alert("Edit is coming next.");
        }}
        onDelete={handleDelete}
        canEdit={Boolean(selectedJobId)}
        canDelete={Boolean(selectedJobId)}
      />

      <main style={{ padding: 16 }}>
      <JobList
        jobs={jobs}
        selectedJobId={selectedJobId}
        onSelect={setSelectedJobId}
      />
      </main>
    </>
  );
}

export default App;