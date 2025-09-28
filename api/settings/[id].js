// api/settings/[id].js
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

  if (method === "GET") {
    const s = await store.getSettings(id);
    res.status(200).json(s);
    return;
  }

  if (method === "PATCH") {
    try {
      const partial = await readJson(req);
      const current = await store.getSettings(id);
      const next = { ...current, ...partial, id: Number(id) };
      await store.setSettings(id, next);
      res.status(200).json(next);
    } catch (e) {
      res.status(400).json({ error: e?.message || "Invalid request" });
    }
    return;
  }

  res.setHeader("Allow", "GET, PATCH");
  res.status(405).json({ error: "Method Not Allowed" });
}
