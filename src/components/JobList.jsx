import React from "react";
import "../styles/JobList.css";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const STALE_DAYS = 7;
const ACTIVE_STATUSES = new Set(["Applied", "Interviewing"]);

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function lastActivityDate(job) {
  const h = job.statusHistory;
  return h && h.length > 0 ? h[h.length - 1].date : job.date;
}

function JobList({ jobs, selectedJobId, onSelect }) {
  if (jobs.length === 0) {
    return (
      <p className="no-jobs">
        No applications match your filters. Click <strong>Add Job</strong> to
        create a new entry.
      </p>
    );
  }

  return (
    <div className="table-wrap">
      <div className="table-meta">
        <span className="count">
          {jobs.length} application{jobs.length !== 1 ? "s" : ""}
        </span>
        <span className="hint">Select a row to edit or delete</span>
      </div>
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
                onClick={() =>
                  onSelect(job.id === selectedJobId ? null : job.id)
                }
              >
                <td className="company-cell" data-label="Company">
                  {job.company}
                </td>
                <td className="title-cell" data-label="Title">
                  {job.title}
                </td>
                <td className="status-cell" data-label="Status">
                  <span className={`status-pill ${job.status}`}>
                    {job.status}
                  </span>
                  {ACTIVE_STATUSES.has(job.status) &&
                    daysSince(lastActivityDate(job)) >= STALE_DAYS && (
                      <span
                        className="stale-badge"
                        title={`No response after ${daysSince(lastActivityDate(job))} days — consider following up`}
                      >
                        ⚠ {job.status === "Applied" ? "No response" : "Follow up"} · {daysSince(lastActivityDate(job))}d
                      </span>
                    )}
                </td>
                <td className="date-cell" data-label="Date">
                  {job.date}
                </td>
                <td className="link-cell" data-label="Link">
                  {job.link ? (
                    <a
                      className="job-link"
                      href={job.link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </a>
                  ) : (
                    <span style={{ color: "var(--faint)" }}>—</span>
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
