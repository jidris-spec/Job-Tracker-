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

export default function Dashboard({ jobs }) {
  const { totals, successRate } = getJobStats(jobs);

  const pieData = [
    { name: "Applied", value: totals.Applied },
    { name: "Interviewing", value: totals.Interviewing },
    { name: "Offer", value: totals.Offer },
    { name: "Rejected", value: totals.Rejected },
  ].filter((d) => d.value > 0); // hide zero slices

  return (
    <section className="dashboard">
      {/* Status distribution pie + right legend */}
      <div className="chart">
        <h4 className="chart-title">Applications by Status</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart margin={{ right: 160 }}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
              cx="35%"  // move pie left to make room for legend
              cy="50%"
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>

            <Tooltip
              formatter={(val, name) => {
                const pct =
                  totals.total > 0
                    ? Math.round((val / totals.total) * 100)
                    : 0;
                return [`${val} (${pct}%)`, name];
              }}
            />

            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              wrapperStyle={{ paddingLeft: 12 }}
              formatter={(value, entry) => {
                const count = entry?.payload?.value ?? 0;
                const pct =
                  totals.total > 0
                    ? Math.round((count / totals.total) * 100)
                    : 0;
                return `${value} — ${count} (${pct}%)`;
              }}
            />
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
