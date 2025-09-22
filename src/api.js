const API_BASE = import.meta.env.VITE_API_BASE || "/api"; // fallback to proxy

export const JobAPI = {
  async list() {
    const r = await fetch(`${API_BASE}/jobs`);
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json();
  },
  async create(job) {
    const r = await fetch(`${API_BASE}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    if (!r.ok) throw new Error(`Create failed (${r.status})`);
    return r.json();
  },
  async update(id, partial) {
    const r = await fetch(`${API_BASE}/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (!r.ok) throw new Error(`Update failed (${r.status})`);
    return r.json();
  },
  async remove(id) {
    const r = await fetch(`${API_BASE}/jobs/${id}`, { method: "DELETE" });
    if (!r.ok) throw new Error(`Delete failed (${r.status})`);
    return true;
  },
};
