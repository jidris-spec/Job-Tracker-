import React from "react";
import "../styles/Dashboard.css";
import getJobStats from "../utils/stats";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

const COLORS = {
  Applied: "#3b82f6",
  Interviewing: "#f59e0b",
  Offer: "#22c55e",
  Rejected: "#ef4444",
};

function getMonthlyData(jobs) {
  const byMonth = {};
  for (const job of jobs) {
    const d = new Date(job.date);
    if (isNaN(d)) continue;
    const key = d.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    if (!byMonth[key]) {
      byMonth[key] = {
        month: key,
        _sort: d.getFullYear() * 12 + d.getMonth(),
        Applied: 0,
        Interviewing: 0,
        Offer: 0,
        Rejected: 0,
      };
    }
    if (byMonth[key][job.status] != null) byMonth[key][job.status]++;
  }
  return Object.values(byMonth).sort((a, b) => a._sort - b._sort);
}

function KPI({ label, value, meta, icon: Icon, tone }) {
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
      {meta && <div className="kpi-meta">{meta}</div>}
    </div>
  );
}

export default function Analytics({ jobs = [] }) {
  const { totals, successRate } = getJobStats(jobs);
  const monthlyData = getMonthlyData(jobs);

  const responded = totals.Interviewing + totals.Offer + totals.Rejected;
  const responseRate =
    totals.total > 0 ? Math.round((responded / totals.total) * 100) : 0;

  const pieData = [
    { name: "Applied", value: totals.Applied },
    { name: "Interviewing", value: totals.Interviewing },
    { name: "Offer", value: totals.Offer },
    { name: "Rejected", value: totals.Rejected },
  ].filter((d) => d.value > 0);

  const axisTick = { fill: "var(--muted)", fontSize: 12 };

  return (
    <section className="dashboard">
      <div className="kpis">
        <KPI
          label="Total Applications"
          value={totals.total}
          meta="All time"
          icon={WorkOutlineIcon}
        />
        <KPI
          label="Response Rate"
          value={`${responseRate}%`}
          meta="Heard back from employers"
          icon={TrendingUpIcon}
          tone="interviewing"
        />
        <KPI
          label="Offer Rate"
          value={`${successRate}%`}
          meta="Offers per application"
          icon={EmojiEventsIcon}
          tone="offer"
        />
        <KPI
          label="Rejected"
          value={totals.Rejected}
          meta="Part of the process"
          icon={HighlightOffIcon}
          tone="rejected"
        />
      </div>

      <div className="panel-grid two">
        <div className="panel">
          <div className="panel-head">
            <h3>Applications by Month</h3>
            <span className="hint">Status distribution over time</span>
          </div>
          {monthlyData.length === 0 ? (
            <div className="panel-empty">
              No data yet. Add some jobs to see trends.
            </div>
          ) : (
            <div className="panel-body">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
                  barGap={2}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--card-border)"
                    vertical={false}
                  />
                  <XAxis dataKey="month" tick={axisTick} tickLine={false} axisLine={false} />
                  <YAxis tick={axisTick} allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "var(--primary-soft)" }} />
                  <Legend wrapperStyle={{ paddingTop: 12 }} />
                  <Bar dataKey="Applied" stackId="a" fill={COLORS.Applied} />
                  <Bar dataKey="Interviewing" stackId="a" fill={COLORS.Interviewing} />
                  <Bar dataKey="Offer" stackId="a" fill={COLORS.Offer} />
                  <Bar dataKey="Rejected" stackId="a" fill={COLORS.Rejected} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Status Breakdown</h3>
            <span className="hint">Share of total</span>
          </div>
          {pieData.length === 0 ? (
            <div className="panel-empty">No data yet.</div>
          ) : (
            <div className="panel-body">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    innerRadius="52%"
                    paddingAngle={2}
                    stroke="none"
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
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
