// api/_lib/store.js
// Storage helper for serverless functions on Vercel.
// Uses Vercel KV if available, otherwise falls back to in-memory storage.

import { createClient } from "@vercel/kv";

// Only initialise KV when the required env vars are present.
// Importing the `kv` singleton directly throws at module load time
// when env vars are missing, which crashes every handler with a 500.
const kvUrl = process.env.KV_REST_API_URL || process.env.KV_URL;
const kvToken = process.env.KV_REST_API_TOKEN;
const hasKV = Boolean(kvUrl && kvToken);

let kv = null;
if (hasKV) {
  try {
    kv = createClient({ url: kvUrl, token: kvToken });
  } catch {
    // createClient failed — fall through to in-memory store
  }
}

// In-memory fallback shared across warm invocations in same container
const mem = (() => {
  if (!globalThis.__MEM_STORE__) {
    globalThis.__MEM_STORE__ = {
      jobs: [],
      settings: { "1": { id: 1, theme: "dark" } },
    };
  }
  return globalThis.__MEM_STORE__;
})();

export async function getJobs() {
  if (hasKV) {
    const data = (await kv.get("jobs")) || [];
    return Array.isArray(data) ? data : [];
  }
  return mem.jobs;
}

export async function setJobs(jobs) {
  if (hasKV) {
    await kv.set("jobs", jobs);
  } else {
    mem.jobs = jobs;
  }
}

export async function getSettings(id) {
  const key = `settings:${id}`;
  if (hasKV) {
    const data = await kv.get(key);
    if (data && typeof data === "object") return data;
    const def = { id: Number(id), theme: "dark" };
    await kv.set(key, def);
    return def;
  }
  if (!mem.settings[id]) mem.settings[id] = { id: Number(id), theme: "dark" };
  return mem.settings[id];
}

export async function setSettings(id, obj) {
  const key = `settings:${id}`;
  if (hasKV) {
    await kv.set(key, obj);
  } else {
    mem.settings[id] = obj;
  }
}

export const store = { getJobs, setJobs, getSettings, setSettings };
