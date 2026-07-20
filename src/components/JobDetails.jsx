import React from "react";
import { Button, Box, Typography, Divider } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GetAppIcon from "@mui/icons-material/GetApp";
import "../styles/JobDetails.css";

export default function JobDetails({ job, onEdit, onDelete }) {
  if (!job) {
    return (
      <div className="job-details-empty">
        <p>Select a job to view details</p>
      </div>
    );
  }

  return (
    <div className="job-details-panel">
      {/* Header */}
      <div className="details-header">
        <h2>{job.company}</h2>
        <p className="job-title">{job.title}</p>
      </div>

      <Divider sx={{ my: 2 }} />

      {/* Main Info */}
      <Box sx={{ mb: 3 }}>
        <div className="detail-row">
          <span className="label">Status:</span>
          <span className={`status-pill ${job.status}`}>{job.status}</span>
        </div>
        <div className="detail-row">
          <span className="label">Date Applied:</span>
          <span>{job.date}</span>
        </div>
        {job.link && (
          <div className="detail-row">
            <span className="label">Link:</span>
            <a href={job.link} target="_blank" rel="noreferrer" className="job-link">
              Open Job Posting
            </a>
          </div>
        )}
      </Box>

      {/* Notes */}
      {job.notes && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              Notes
            </Typography>
            <p className="notes-text">{job.notes}</p>
          </Box>
        </>
      )}

      {/* Attachments */}
      {(job.cv_url || job.cover_letter_url) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 2 }}>
              Attachments
            </Typography>
            <div className="attachments-list">
              {job.cv_url && (
                <a href={job.cv_url} download className="attachment-item">
                  <GetAppIcon sx={{ fontSize: 18 }} />
                  <span>CV</span>
                </a>
              )}
              {job.cover_letter_url && (
                <a href={job.cover_letter_url} download className="attachment-item">
                  <GetAppIcon sx={{ fontSize: 18 }} />
                  <span>Cover Letter</span>
                </a>
              )}
            </div>
          </Box>
        </>
      )}

      {/* Actions */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={onEdit}
          size="small"
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
          size="small"
        >
          Delete
        </Button>
      </Box>
    </div>
  );
}