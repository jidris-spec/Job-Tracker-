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
    <div className="table-wrap">
      <table>
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
                className={`job-row${selected ? " selected" : ""}`}
                onClick={() => onSelect(job.id === selectedJobId ? null : job.id)}
              >
                <td data-label="Company">{job.company}</td>
                <td data-label="Title">{job.title}</td>
                <td data-label="Status">{job.status}</td>
                <td data-label="Date">{job.date}</td>
                <td data-label="Link">
                  {job.link ? (
                    <a
                      className="job-link"
                      href={job.link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      open
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default JobList;
