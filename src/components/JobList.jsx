import React from "react";

function JobList({ jobs, selectedJobId, onSelect }) {
 
  if (jobs.length === 0) {
    return (
      <p style={{ opacity: 0.8 }}>
        No jobs yet. Click <strong>+ Add Job</strong> to create your first entry.
      </p>
    );
  }

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        background: "#fff",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <thead>
        <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
          <th style={th}>Company</th>
          <th style={th}>Title</th>
          <th style={th}>Status</th>
          <th style={th}>Date</th>
          <th style={th}>Link</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => {
          const selected = job.id === selectedJobId;
          return (
            <tr
              key={job.id}
              onClick={() => onSelect(job.id)}
              style={{
                cursor: "pointer",
                background: selected ? "#e0f2f1" : "transparent",
              }}
            >
              <td style={td}>{job.company}</td>
              <td style={td}>{job.title}</td>
              <td style={td}>{job.status}</td>
              <td style={td}>{job.date}</td>
              <td style={td}>
                {job.link ? (
                  <a href={job.link} target="_blank" rel="noreferrer">
                    open
                  </a>
                ) : (
                  <span style={{ opacity: 0.6 }}>—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const th = { padding: "12px 14px", fontWeight: 600, borderBottom: "1px solid #e5e7eb" };
const td = { padding: "12px 14px", borderBottom: "1px solid #f1f5f9" };

export default JobList;
