import React from "react";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DownloadIcon from "@mui/icons-material/Download";
import exportJobsToCsv from "../utils/exportCsv";

const card = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: 12,
  padding: "16px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
};

const btn = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 16px",
  borderRadius: 8,
  border: "1px solid var(--card-border)",
  background: "var(--card-bg)",
  color: "var(--fg)",
  fontSize: 14,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export default function Settings({ mode, onToggleTheme, jobs = [] }) {
  return (
    <section style={{ padding: "8px 0" }}>
      <h2 style={{ color: "var(--fg)", marginBottom: 20, fontSize: 20, fontWeight: 700 }}>
        Settings
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={card}>
          <div>
            <div style={{ color: "var(--fg)", fontWeight: 600, marginBottom: 4 }}>Appearance</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Currently using {mode === "dark" ? "dark" : "light"} mode
            </div>
          </div>
          <button style={btn} onClick={onToggleTheme}>
            {mode === "dark" ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
            {mode === "dark" ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>

        <div style={card}>
          <div>
            <div style={{ color: "var(--fg)", fontWeight: 600, marginBottom: 4 }}>Export Data</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Download all {jobs.length} application{jobs.length !== 1 ? "s" : ""} as a CSV file
            </div>
          </div>
          <button style={btn} onClick={() => exportJobsToCsv(jobs)} disabled={jobs.length === 0}>
            <DownloadIcon fontSize="small" />
            Export CSV
          </button>
        </div>
      </div>
    </section>
  );
}
