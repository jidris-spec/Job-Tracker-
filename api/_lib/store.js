// api/_lib/store.js
// Storage helper for serverless functions on Vercel.
// Uses Vercel KV if available, otherwise falls back to in-memory storage.

import { kv as vercelKv } from "@vercel/kv";

// In some environments, the import may be undefined. Guard it safely.
const kv = vercelKv || null;

// Detect whether KV is configured (env vars present)
const hasKV = Boolean(
  kv && (process.env.KV_REST_API_URL || process.env.KV_URL)
);

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
