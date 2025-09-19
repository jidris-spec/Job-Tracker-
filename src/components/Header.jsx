import React from "react";
import "../styles/Header.css";
import Logo from "../assets/logo.svg";
import JobForm from "./JobForm";

function Header({ onCreate, onEdit, onDelete, canEdit, canDelete }) {
  const [open, setOpen] = React.useState(false);

  return (
    <header>
      <img src={Logo} alt="Job Tracker Logo" className="logo" />
      <h3 className="label">Job Application Tracker</h3>

      <nav className="actions">
        <button type="button" className="action" onClick={() => setOpen(true)}>
          + Add Job
        </button>

        <button
          type="button"
          className="action action--ghost"
          onClick={onEdit}
          disabled={!canEdit}
          title={!canEdit ? "Select a job first" : undefined}
        >
          Edit Job
        </button>

        <button
          type="button"
          className="action action--ghost"
          onClick={onDelete}
          disabled={!canDelete}
          title={!canDelete ? "Select a job first" : undefined}
        >
          Delete Job
        </button>

        <button type="button" className="action action--ghost">Filter</button>
        <button type="button" className="action action--ghost">Export</button>
      </nav>

      <JobForm open={open} setOpen={setOpen} onCreate={onCreate} hideTrigger />
    </header>
  );
}

export default Header;
