import { MockJobsAPI } from "./mockJobs";

export const JobAPI = {
  async list(userId) {
    return MockJobsAPI.getJobs(userId);
  },

  async create(userId, job) {
    return MockJobsAPI.createJob(userId, job);
  },

  async update(userId, id, partial) {
    return MockJobsAPI.updateJob(userId, id, partial);
  },

  async remove(userId, id) {
    return MockJobsAPI.deleteJob(userId, id);
  },
};

export const ThemeAPI = {
  async get() {
    const r = await fetch(`/api/settings/1`);
    if (!r.ok) throw new Error(`Theme fetch failed (${r.status})`);
    const data = await r.json();
    return { mode: data.theme || "light" };
  },
  async set(mode) {
    const r = await fetch(`/api/settings/1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: mode }),
    });
    if (!r.ok) throw new Error(`Theme update failed (${r.status})`);
    const data = await r.json();
    return { mode: data.theme };
  },
};