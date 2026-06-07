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
  themeMode = "light",
  onToggleTheme = () => {},
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (isEditing) setOpen(true);
  }, [isEditing]);

  const handleClose = () => {
    setOpen(false);
    if (isEditing) onCancelEdit();
  };

  return (
    <header>
      <img src="/logo.svg" alt="Job Tracker Logo" className="logo" />
      <h3 className="label">Job Applications Tracker</h3>

      <nav className="actions">
        <button
          type="button"
          className="action"
          onClick={() => setOpen(true)}
          disabled={isEditing}
        >
          <AddIcon fontSize="small" />
          <span className="btn-label">{isEditing ? "Editing…" : "Add Job"}</span>
        </button>

        <button
          type="button"
          className="action action--ghost"
          onClick={onEdit}
          disabled={!canEdit || isEditing}
          title={!canEdit ? "Select a job first" : isEditing ? "Finish current edit first" : "Edit selected job"}
        >
          <EditIcon fontSize="small" />
          <span className="btn-label">Edit</span>
        </button>

        <button
          type="button"
          className="action action--ghost"
          onClick={onDelete}
          disabled={!canDelete || isEditing}
          title={!canDelete ? "Select a job first" : isEditing ? "Finish current edit first" : "Delete selected job"}
        >
          <DeleteIcon fontSize="small" />
          <span className="btn-label">Delete</span>
        </button>

        <button
          type="button"
          className="action action--ghost"
          onClick={() => exportJobsToCsv(jobs)}
          title="Export to CSV"
        >
          <DownloadIcon fontSize="small" />
          <span className="btn-label">Export</span>
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
    </header>
  );
}

export default Header;
