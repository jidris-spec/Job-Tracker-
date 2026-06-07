import React from "react";
import "../styles/Settings.css";
import getJobStats from "../utils/stats";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DownloadIcon from "@mui/icons-material/Download";
import PaletteIcon from "@mui/icons-material/Palette";
import StorageIcon from "@mui/icons-material/Storage";
import InsightsIcon from "@mui/icons-material/Insights";
import exportJobsToCsv from "../utils/exportCsv";

export default function Settings({ mode, onToggleTheme, jobs = [] }) {
  const { totals, successRate } = getJobStats(jobs);

  return (
    <section className="settings">
      <div className="settings-summary">
        <div className="settings-summary-icon" aria-hidden="true">
          <InsightsIcon />
        </div>
        <div className="settings-summary-stats">
          <div className="ss-item">
            <span className="ss-value">{totals.total}</span>
            <span className="ss-label">Applications</span>
          </div>
          <div className="ss-item">
            <span className="ss-value">{totals.Interviewing}</span>
            <span className="ss-label">Interviewing</span>
          </div>
          <div className="ss-item">
            <span className="ss-value">{totals.Offer}</span>
            <span className="ss-label">Offers</span>
          </div>
          <div className="ss-item">
            <span className="ss-value">{successRate}%</span>
            <span className="ss-label">Success rate</span>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-left">
          <span className="settings-card-icon" aria-hidden="true">
            <PaletteIcon fontSize="small" />
          </span>
          <div>
            <div className="settings-card-title">Appearance</div>
            <div className="settings-card-desc">
              Currently using {mode === "dark" ? "dark" : "light"} mode
            </div>
          </div>
        </div>
        <button className="settings-btn" onClick={onToggleTheme}>
          {mode === "dark" ? (
            <LightModeIcon fontSize="small" />
          ) : (
            <DarkModeIcon fontSize="small" />
          )}
          {mode === "dark" ? "Switch to Light" : "Switch to Dark"}
        </button>
      </div>

      <div className="settings-card">
        <div className="settings-card-left">
          <span className="settings-card-icon" aria-hidden="true">
            <StorageIcon fontSize="small" />
          </span>
          <div>
            <div className="settings-card-title">Export Data</div>
            <div className="settings-card-desc">
              Download all {jobs.length} application
              {jobs.length !== 1 ? "s" : ""} as a CSV file
            </div>
          </div>
        </div>
        <button
          className="settings-btn"
          onClick={() => exportJobsToCsv(jobs)}
          disabled={jobs.length === 0}
        >
          <DownloadIcon fontSize="small" />
          Export CSV
        </button>
      </div>
    </section>
  );
}
