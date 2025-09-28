// api/jobs/[id].js
import { store } from "../../api/_lib/store.js";

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;

  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  if (method === "PATCH") {
    try {
      const partial = await readJson(req);
      const jobs = await store.getJobs();
      const idx = jobs.findIndex((j) => String(j.id) === String(id));
      if (idx === -1) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const updated = { ...jobs[idx], ...partial };
      jobs[idx] = updated;
      await store.setJobs(jobs);
      res.status(200).json(updated);
    } catch (e) {
      res.status(400).json({ error: e?.message || "Invalid request" });
    }
    return;
  }

  if (method === "DELETE") {
    const jobs = await store.getJobs();
    const idx = jobs.findIndex((j) => String(j.id) === String(id));
    if (idx === -1) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const next = jobs.slice(0, idx).concat(jobs.slice(idx + 1));
    await store.setJobs(next);
    res.status(204).end();
    return;
  }

  res.setHeader("Allow", "PATCH, DELETE");
  res.status(405).json({ error: "Method Not Allowed" });
}
