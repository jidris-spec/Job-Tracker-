import "../styles/Sidebar.css";

import DashboardIcon from "@mui/icons-material/Dashboard";
import WorkIcon from "@mui/icons-material/Work";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import SettingsIcon from "@mui/icons-material/Settings";

function Sidebar({
activePage,
setActivePage,
}) {
return ( <aside className="sidebar"> <div className="sidebar-header"> <h2>JobTrack</h2> <p>Application Manager</p> </div>


  <nav className="sidebar-nav">

    <button
      className={`sidebar-link ${
        activePage === "dashboard"
          ? "active"
          : ""
      }`}
      onClick={() =>
        setActivePage("dashboard")
      }
    >
      <DashboardIcon fontSize="small" />
      <span>Dashboard</span>
    </button>

    <button
      className={`sidebar-link ${
        activePage === "applications"
          ? "active"
          : ""
      }`}
      onClick={() =>
        setActivePage("applications")
      }
    >
      <WorkIcon fontSize="small" />
      <span>Applications</span>
    </button>

    <button
      className={`sidebar-link ${
        activePage === "analytics"
          ? "active"
          : ""
      }`}
      onClick={() =>
        setActivePage("analytics")
      }
    >
      <AnalyticsIcon fontSize="small" />
      <span>Analytics</span>
    </button>

    <button
      className={`sidebar-link ${
        activePage === "settings"
          ? "active"
          : ""
      }`}
      onClick={() =>
        setActivePage("settings")
      }
    >
      <SettingsIcon fontSize="small" />
      <span>Settings</span>
    </button>

  </nav>
</aside>

);
}

export default Sidebar;
