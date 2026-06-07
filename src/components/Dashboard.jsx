import React from "react";
import "../styles/Dashboard.css";
import getJobStats from "../utils/stats";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import SendIcon from "@mui/icons-material/Send";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const COLORS = {
  Applied: "var(--st-applied)",
  Interviewing: "var(--st-interviewing)",
  Offer: "var(--st-offer)",
  Rejected: "var(--st-rejected)",
};

function KPI({ label, value, meta, icon: Icon, tone, children }) {
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {Icon && (
          <span className={`kpi-icon ${tone || ""}`} aria-hidden="true">
            <Icon fontSize="small" />
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {children}
      {meta && <div className="kpi-meta">{meta}</div>}
    </div>
  );
}

export default function Dashboard({ jobs = [] }) {
  const { totals, successRate } = getJobStats(jobs);

  const active = totals.Applied + totals.Interviewing;

  const pieData = [
    { name: "Applied", value: totals.Applied },
    { name: "Interviewing", value: totals.Interviewing },
    { name: "Offer", value: totals.Offer },
    { name: "Rejected", value: totals.Rejected },
  ].filter((d) => d.value > 0);

  const recent = [...jobs]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <section className="dashboard">
      <div className="kpis">
        <KPI
          label="Total Applications"
          value={totals.total}
          meta={`${active} currently active`}
          icon={WorkOutlineIcon}
        />
        <KPI
          label="Applied"
          value={totals.Applied}
          meta="Awaiting a response"
          icon={SendIcon}
          tone="applied"
        />
        <KPI
          label="Interviewing"
          value={totals.Interviewing}
          meta="In conversation"
          icon={RecordVoiceOverIcon}
          tone="interviewing"
        />
        <KPI
          label="Offers"
          value={totals.Offer}
          meta="Success rate"
          icon={EmojiEventsIcon}
          tone="offer"
        >
          <div className="kpi-progress" aria-hidden="true">
            <span style={{ width: `${Math.min(successRate, 100)}%` }} />
          </div>
        </KPI>
      </div>

      <div className="panel-grid two">
        <div className="panel">
          <div className="panel-head">
            <h3>Recent Activity</h3>
            <span className="hint">Latest 5</span>
          </div>
          <div className="panel-body">
            {recent.length === 0 ? (
              <div className="panel-empty">
                No applications yet. Add your first one to get started.
              </div>
            ) : (
              <ul className="activity-list">
                {recent.map((job) => (
                  <li key={job.id} className="activity-item">
                    <div className="activity-main">
                      <span className="activity-company">{job.company}</span>
                      <span className="activity-title">{job.title}</span>
                    </div>
                    <div className="activity-right">
                      <span className={`status-pill ${job.status}`}>
                        {job.status}
                      </span>
                      <span className="activity-date">{job.date}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Pipeline Breakdown</h3>
            <span className="hint">By status</span>
          </div>
          {pieData.length === 0 ? (
            <div className="panel-empty">No data yet.</div>
          ) : (
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="92%"
                    innerRadius="64%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <div>
                  <div className="num">{totals.total}</div>
                  <div className="cap">Total</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
