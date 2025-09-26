import React from "react";
import "../styles/Header.css";
import Logo from "../assets/logo.svg";
import JobForm from "./JobForm";
import { useState, useEffect } from "react";
import exportJobsToCsv from "../utils/exportCsv";
import DownloadIcon from "@mui/icons-material/Download";






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
  
}) {
  const [open, setOpen] = React.useState(false);
  // const [theme, setTheme] = React.useState("light");
  
  React.useEffect(() => {
    if (isEditing) {
      setOpen(true);
    }
  }, [isEditing]);

  

  const handleClose = () => {
    setOpen(false);
    if (isEditing) {
      onCancelEdit();
    }
  };

  

  return (
    <header>
      <img src={Logo} alt="Job Tracker Logo" className="logo" />
      <h3 className="label">Job Applications Tracker</h3>

      <nav className="actions">
        <button 
          type="button" 
          className="action" 
          onClick={() => setOpen(true)}
          disabled={isEditing}
        >
          {isEditing ? 'Editing...' : '+ Add Job'}
        </button>

        <button
          type="button"
          className="action action--ghost"
          onClick={onEdit}
          disabled={!canEdit || isEditing}
          title={!canEdit ? "Select a job first" : isEditing ? "Finish current edit first" : "Edit selected job"}
        >
          Edit Job
        </button>

        <button
          type="button"
          className="action action--ghost"
          onClick={onDelete}
          disabled={!canDelete || isEditing}
          title={!canDelete ? "Select a job first" : isEditing ? "Finish current edit first" : "Delete selected job"}
        >
          Delete Job
        </button>

        <button
          type="button"
          className="action action--ghost"
          onClick={() => exportJobsToCsv(editingJob ? [editingJob] : jobs)}
          title="Export Jobs"
          >
          <DownloadIcon />
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
