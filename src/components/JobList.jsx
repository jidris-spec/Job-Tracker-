import React from "react";
import "../styles/JobList.css";

function JobList({ jobs, selectedJobId, onSelect }) {
  if (jobs.length === 0) {
    return (
      <p className="no-jobs">
        No jobs yet. Click <strong>+ Add Job</strong> to create your first entry.
      </p>
    );
  }

  return (
    <table className="job-table">
      <thead>
        <tr>
          <th>Company</th>
          <th>Title</th>
          <th>Status</th>
          <th>Date</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => {
          const selected = job.id === selectedJobId;
          return (
            <tr
              key={job.id}
              className={`job-row ${selected ? "selected" : ""}`}
              onClick={() => onSelect(job.id)}
            >
              <td>{job.company}</td>
              <td>{job.title}</td>
              <td>{job.status}</td>
              <td>{job.date}</td>
              <td>
                {job.link ? (
                  <a
                    className="job-link"
                    href={job.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    open
                  </a>
                ) : (
                  <span className="job-empty"></span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default JobList;
