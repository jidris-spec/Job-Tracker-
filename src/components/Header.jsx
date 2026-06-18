import React from "react";
import "../styles/Header.css";

import JobForm from "./JobForm";
import exportJobsToCsv from "../utils/exportCsv";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

const PAGE_META = {
  dashboard: {
    title: "Dashboard",
    sub: "An overview of your job search at a glance",
  },
  applications: {
    title: "Applications",
    sub: "Every role you've applied to, in one place",
  },
  analytics: {
    title: "Analytics",
    sub: "Trends and insights across your pipeline",
  },
  settings: {
    title: "Settings",
    sub: "Preferences and data management",
  },
};

function Header({
  jobs,
  onCreate,
  onEdit,
  onDelete,
  onCancelEdit,
  canEdit,
  canDelete,
  isEditing,
  editingJob,
  onUpdate,
  activePage = "dashboard",
  themeMode = "dark",
  onToggleTheme = () => {},
}) {
  const [open, setOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (isEditing) setOpen(true);
  }, [isEditing]);

  const handleClose = () => {
    setOpen(false);
    if (isEditing) onCancelEdit();
  };

  const meta = PAGE_META[activePage] || PAGE_META.dashboard;
  const showRowActions = activePage === "applications";

  return (
    <header className="topbar">
      <div className="topbar-titles">
        <h3>{meta.title}</h3>
        <p className="sub">{meta.sub}</p>
      </div>

      <nav className="actions" aria-label="Toolbar actions">
        {showRowActions && (
          <>
            <button
              type="button"
              className="action action--ghost"
              onClick={onEdit}
              disabled={!canEdit || isEditing}
              title={
                !canEdit
                  ? "Select a job first"
                  : isEditing
                  ? "Finish current edit first"
                  : "Edit selected job"
              }
            >
              <EditIcon fontSize="small" />
              <span className="btn-label">Edit</span>
            </button>

            <button
              type="button"
              className="action action--ghost"
              onClick={() => setConfirmDelete(true)}
              disabled={!canDelete || isEditing}
              title={
                !canDelete
                  ? "Select a job first"
                  : isEditing
                  ? "Finish current edit first"
                  : "Delete selected job"
              }
            >
              <DeleteIcon fontSize="small" />
              <span className="btn-label">Delete</span>
            </button>
          </>
        )}

        <button
          type="button"
          className="action header-export"
          onClick={() => exportJobsToCsv(jobs)}
          disabled={!jobs || jobs.length === 0}
          title="Export to CSV"
        >
          <DownloadIcon fontSize="small" />
          <span className="btn-label">Export</span>
        </button>

        <button
          type="button"
          className="action action--icon"
          onClick={onToggleTheme}
          title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle color theme"
        >
          {themeMode === "dark" ? (
            <LightModeIcon fontSize="small" />
          ) : (
            <DarkModeIcon fontSize="small" />
          )}
        </button>

        <span className="topbar-divider" aria-hidden="true" />

        <button
          type="button"
          className="action action--primary"
          onClick={() => setOpen(true)}
          disabled={isEditing}
        >
          <AddIcon fontSize="small" />
          <span className="btn-label">{isEditing ? "Editing…" : "Add Job"}</span>
        </button>
      </nav>

      <JobForm
        open={open}
        setOpen={setOpen}
        onCreate={onCreate}
        onUpdate={onUpdate}
        hideTrigger
        jobToEdit={isEditing ? editingJob : null}
        onClose={handleClose}
      />

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete application?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove the selected job. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDelete();
              setConfirmDelete(false);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </header>
  );
}

export default Header;
