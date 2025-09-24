// src/components/Dashboard.jsx
import React from "react";
import "../styles/Dashboard.css";
import getJobStats from "../utils/stats";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = {
  Applied: "#4f46e5",
  Interviewing: "#f59e0b",
  Offer: "#10b981",
  Rejected: "#ef4444",
};

function KPI({ label, value }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

export default function Dashboard({ jobs = [] }) {
  const { totals, successRate } = getJobStats(jobs);

  const pieData = [
    { name: "Applied", value: totals.Applied },
    { name: "Interviewing", value: totals.Interviewing },
    { name: "Offer", value: totals.Offer },
    { name: "Rejected", value: totals.Rejected },
  ].filter((d) => d.value > 0);

  const legendFormatter = (value, entry) => {
    const count = entry && entry.payload ? entry.payload.value : 0;
    const pct =
      totals.total > 0 ? Math.round((count / totals.total) * 100) : 0;
    return `${value} — ${count} (${pct}%)`;
  };

  return (
    <section className="dashboard">
      {/* KPI cards */}
      <div className="kpis">
        <KPI label="Total" value={totals.total} />
        <KPI label="Applied" value={totals.Applied} />
        <KPI label="Interviewing" value={totals.Interviewing} />
        <KPI label="Offers" value={totals.Offer} />
        <KPI label="Rejected" value={totals.Rejected} />
        <KPI label="Success Rate" value={`${successRate}%`} />
      </div>

      {/* Chart */}
      <div className="chart">
        {pieData.length === 0 ? (
          <p>No data yet. Add some jobs to see the chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="38%"           // move pie slightly left to make space for right legend
                cy="50%"
                outerRadius={110}
                innerRadius={60}   // <-- makes it a doughnut
                label={false}      // no numbers on slices
                labelLine={false}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={legendFormatter}
                wrapperStyle={{ paddingLeft: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
