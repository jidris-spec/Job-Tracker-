import "../styles/Sidebar.css";

import DashboardIcon from "@mui/icons-material/Dashboard";
import WorkIcon from "@mui/icons-material/Work";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import SettingsIcon from "@mui/icons-material/Settings";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: DashboardIcon },
  { key: "applications", label: "Applications", icon: WorkIcon },
  { key: "analytics", label: "Analytics", icon: AnalyticsIcon },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">
          <TrackChangesIcon fontSize="small" />
        </span>
        <div className="brand-text">
          <h2>JobTrack</h2>
          <p>Application Pipeline</p>
        </div>
      </div>

      <div className="sidebar-section-label">Menu</div>

      <nav className="sidebar-nav" aria-label="Primary">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`sidebar-link ${activePage === key ? "active" : ""}`}
            onClick={() => setActivePage(key)}
            aria-current={activePage === key ? "page" : undefined}
          >
            <Icon fontSize="small" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="name">Job Seeker</div>
        <div className="role">Tracking the hunt</div>
      </div>
    </aside>
  );
}

export default Sidebar;
