const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export const JobAPI = {
  async list(userId) {
    const r = await fetch(`${API_BASE}/users/${userId}/jobs`);
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json();
  },

  async create(userId, job) {
    const r = await fetch(`${API_BASE}/users/${userId}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    if (!r.ok) throw new Error(`Create failed (${r.status})`);
    return r.json();
  },

  async update(userId, id, partial) {
    const r = await fetch(`${API_BASE}/users/${userId}/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (!r.ok) throw new Error(`Update failed (${r.status})`);
    return r.json();
  },

  async remove(userId, id) {
    const r = await fetch(`${API_BASE}/users/${userId}/jobs/${id}`, { method: "DELETE" });
    if (!r.ok) throw new Error(`Delete failed (${r.status})`);
    return true;
  },
};

export const ThemeAPI = {
  async get() {
    const r = await fetch(`${API_BASE}/settings/1`);
    if (!r.ok) throw new Error(`Theme fetch failed (${r.status})`);
    const data = await r.json();
    return { mode: data.theme || "light" };
  },
  async set(mode) {
    const r = await fetch(`${API_BASE}/settings/1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: mode }),
    });
    if (!r.ok) throw new Error(`Theme update failed (${r.status})`);
    const data = await r.json();
    return { mode: data.theme };
  },
};