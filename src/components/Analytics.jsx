import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import getJobStats from "../utils/stats";

const KPI = ({ label, value, meta, icon: Icon, tone = "neutral" }) => (
  <div className={`kpi ${tone}`}>
    {Icon && <Icon className="kpi-icon" />}
    <div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-meta">{meta}</div>
    </div>
  </div>
);

export default function Analytics({ jobs }) {
  // CHANGE 1: Get the new data from stats
  const { totals, successRate, responseByRole, interviewConversionRate, bestMonth } = getJobStats(jobs);

  if (jobs.length === 0) {
    return (
      <div className="analytics-empty">
        <p>No applications yet. Add some to see analytics!</p>
      </div>
    );
  }

  const chartData = [
    { name: "Applied", value: totals.Applied },
    { name: "Interviewing", value: totals.Interviewing },
    { name: "Offer", value: totals.Offer },
    { name: "Rejected", value: totals.Rejected },
  ];

  const monthlyData = [];
  const monthMap = {};
  jobs.forEach((job) => {
    const date = new Date(job.date);
    const month = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!monthMap[month]) {
      monthMap[month] = { name: month, Applied: 0, Interviewing: 0, Offer: 0, Rejected: 0 };
    }
    monthMap[month][job.status]++;
  });
  Object.values(monthMap).forEach((m) => monthlyData.push(m));

  const colors = {
    Applied: "#3b82f6",
    Interviewing: "#f59e0b",
    Offer: "#10b981",
    Rejected: "#ef4444",
  };

  return (
    <div className="analytics">
      <div className="analytics-head">
        <h2>Analytics</h2>
        <p>Trends and insights across your pipeline</p>
      </div>

      {/* CHANGE 2: Updated KPI section with new cards */}
      <div className="kpis">
        <KPI
          label="Total Applications"
          value={totals.total}
          meta="All time"
          icon={null}
        />
        <KPI
          label="Response Rate"
          value={`${successRate}%`}
          meta="Heard back from employers"
          icon={TrendingUpIcon}
          tone="success"
        />
        <KPI
          label="Offer Rate"
          value={`${Math.round((totals.Offer / totals.total) * 100)}%`}
          meta="Offers per application"
          icon={EmojiEventsIcon}
          tone="offer"
        />
        <KPI
          label="Rejected"
          value={totals.Rejected}
          meta="Part of the process"
          icon={null}
        />
      </div>

      {/* New KPI cards for Interview Conversion and Best Month */}
      <div className="kpis">
        <KPI
          label="Interview Conversion"
          value={`${interviewConversionRate}%`}
          meta="Interviews that become offers"
          icon={TrendingUpIcon}
          tone="offer"
        />
        {bestMonth && (
          <KPI
            label="Best Month"
            value={bestMonth.month}
            meta={`${bestMonth.responseRate}% response rate (${bestMonth.count} apps)`}
            icon={EmojiEventsIcon}
            tone="offer"
          />
        )}
      </div>

      <div className="panels">
        <div className="panel">
          <div className="panel-head">
            <h3>Applications by Month</h3>
            <span className="hint">Status distribution over time</span>
          </div>
          <div className="panel-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="name" stroke="var(--fg-secondary)" />
                <YAxis stroke="var(--fg-secondary)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    color: "var(--fg)",
                  }}
                />
                <Legend />
                <Bar dataKey="Applied" fill={colors.Applied} />
                <Bar dataKey="Interviewing" fill={colors.Interviewing} />
                <Bar dataKey="Offer" fill={colors.Offer} />
                <Bar dataKey="Rejected" fill={colors.Rejected} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Status Breakdown</h3>
            <span className="hint">Share of total</span>
          </div>
          <div className="panel-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={colors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    color: "var(--fg)",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHANGE 3: New panel for Response Rate by Role */}
        <div className="panel">
          <div className="panel-head">
            <h3>Response Rate by Role</h3>
            <span className="hint">Which roles get more responses</span>
          </div>
          {Object.keys(responseByRole).length === 0 ? (
            <div className="panel-empty">No data yet.</div>
          ) : (
            <div className="panel-body" style={{ padding: "20px" }}>
              {Object.entries(responseByRole).map(([role, rate]) => (
                <div
                  key={role}
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{role}</span>
                  <span style={{ fontWeight: "bold", color: "var(--primary)" }}>{rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}