// api/jobs/index.js
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
  const { method } = req;

  if (method === "GET") {
    const jobs = await store.getJobs();
    res.status(200).json(jobs);
    return;
  }

  if (method === "POST") {
    try {
      const payload = await readJson(req);
      if (!payload || typeof payload !== "object") {
        res.status(400).json({ error: "Invalid JSON" });
        return;
      }
      // Ensure id exists (client generates UUID in JobForm)
      const job = {
        id: payload.id || crypto.randomUUID?.() || String(Date.now()),
        company: payload.company || "",
        title: payload.title || "",
        status: payload.status || "Applied",
        date: payload.date || new Date().toISOString().slice(0, 10),
        link: payload.link || "",
        notes: payload.notes || "",
      };

      const jobs = await store.getJobs();
      jobs.unshift(job);
      await store.setJobs(jobs);

      res.status(201).json(job);
    } catch (e) {
      res.status(400).json({ error: e?.message || "Invalid request" });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method Not Allowed" });
}
