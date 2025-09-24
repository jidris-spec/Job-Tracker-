import React from "react";
import getJobStats from "../utils/stats";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";


const COLORS = {
  Applied: "#4f46e5",
  Interviewing: "#f59e0b",
  Offer: "#10b981",
  Rejected: "#ef4444",
};

export default function Dashboard({ jobs }) {
  const { totals, successRate } = getJobStats(jobs);

  const pieData = [
    { name: "Applied", value: totals.Applied },
    { name: "Interviewing", value: totals.Interviewing },
    { name: "Offer", value: totals.Offer },
    { name: "Rejected", value: totals.Rejected },
  ].filter(d => d.value > 0); // hide zero slices

  return (
    <section className="dashboard">
      {/* Top KPI cards */}
      <div className="kpis">
        <KPI label="Total" value={totals.total} />
        <KPI label="Applied" value={totals.Applied} />
        <KPI label="Interviewing" value={totals.Interviewing} />
        <KPI label="Offers" value={totals.Offer} />
        <KPI label="Rejected" value={totals.Rejected} />
        <KPI label="Success Rate" value={`${successRate}%`} />
      </div>

      {/* Status distribution pie */}
      <div className="chart">
        <h4 className="chart-title">Applications by Status</h4>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function KPI({ label, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
