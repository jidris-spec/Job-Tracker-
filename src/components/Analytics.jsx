import React from "react";
import "../styles/Dashboard.css";
import getJobStats from "../utils/stats";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = {
  Applied: "#4f46e5",
  Interviewing: "#f59e0b",
  Offer: "#10b981",
  Rejected: "#ef4444",
};

function getMonthlyData(jobs) {
  const byMonth = {};
  for (const job of jobs) {
    const d = new Date(job.date);
    if (isNaN(d)) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[key]) {
      byMonth[key] = { month: key, Applied: 0, Interviewing: 0, Offer: 0, Rejected: 0 };
    }
    if (byMonth[key][job.status] != null) byMonth[key][job.status]++;
  }
  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
}

function KPI({ label, value }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

export default function Analytics({ jobs = [] }) {
  const { totals, successRate } = getJobStats(jobs);
  const monthlyData = getMonthlyData(jobs);

  const pieData = [
    { name: "Applied", value: totals.Applied },
    { name: "Interviewing", value: totals.Interviewing },
    { name: "Offer", value: totals.Offer },
    { name: "Rejected", value: totals.Rejected },
  ].filter((d) => d.value > 0);

  return (
    <section className="dashboard">
      <div className="kpis">
        <KPI label="Total" value={totals.total} />
        <KPI label="Applied" value={totals.Applied} />
        <KPI label="Interviewing" value={totals.Interviewing} />
        <KPI label="Offers" value={totals.Offer} />
        <KPI label="Rejected" value={totals.Rejected} />
        <KPI label="Success Rate" value={`${successRate}%`} />
      </div>

      <div className="chart">
        <p style={{ padding: "12px 16px 0", color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>
          Applications by Month
        </p>
        {monthlyData.length === 0 ? (
          <p style={{ padding: 16 }}>No data yet. Add some jobs to see trends.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
              <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  color: "var(--fg)",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 8 }} />
              <Bar dataKey="Applied" fill={COLORS.Applied} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Interviewing" fill={COLORS.Interviewing} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Offer" fill={COLORS.Offer} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Rejected" fill={COLORS.Rejected} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="chart">
        <p style={{ padding: "12px 16px 0", color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>
          Status Breakdown
        </p>
        {pieData.length === 0 ? (
          <p style={{ padding: 16 }}>No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                outerRadius={100}
                innerRadius={55}
                label={false}
                labelLine={false}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
