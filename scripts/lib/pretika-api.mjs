/**
 * pretika-api.mjs — shared helpers for the build-time SEO scripts
 * (generate-sitemap.mjs + prerender.mjs).
 *
 * Both scripts run in CI against the LIVE site, so the default base is the
 * production origin (nginx reverse-proxies /api → the .NET backend) — NOT the
 * retiring Render host. Override with PRETIKA_API_BASE (or the older
 * SITEMAP_API_BASE, kept for back-compat).
 */
export const ORIGIN = "https://pretika.in";

export const API = (
  process.env.PRETIKA_API_BASE ||
  process.env.SITEMAP_API_BASE ||
  ORIGIN
).replace(/\/$/, "");

export const MAX_STORIES = 2000;
export const PAGE_SIZE = 50;

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// The Render free tier used to cold-start (~60s); the VPS is warm, but keep a
// patient retry so a momentary blip never fails the build.
export async function getJson(path, tries = 4) {
  const url = `${API}${path}`;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30000),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      // unwrap the { data: … } envelope
      return body && typeof body === "object" && "data" in body ? body.data : body;
    } catch (e) {
      if (i === tries) throw e;
      console.log(`  retry ${i}/${tries - 1} for ${path} (${e.message})…`);
      await new Promise((r) => setTimeout(r, 8000 * i));
    }
  }
}

// Mirrors mediaUrl() in src/lib/constants.js: legacy self-hosted absolute URLs
// (localhost, old onrender hosts) stored in the DB get rewritten to `base`.
// Sitemap passes API; prerender passes ORIGIN so the emitted HTML always points
// at the public site even if the API base is overridden to a raw backend host.
export function mediaUrl(path, base = API) {
  if (!path) return null;
  if (!/^https?:\/\//.test(path)) return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  try {
    const u = new URL(path);
    const selfHosted =
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname.endsWith("onrender.com") ||
      u.hostname.includes("hauntedvoice.in");
    if (selfHosted) return `${base}${u.pathname}`;
  } catch {
    /* fall through */
  }
  return path;
}

export function isoDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export async function fetchCategories() {
  return (await getJson("/api/stories/categories")) || [];
}

// Pages through /api/stories (latest first) and returns a de-duped array.
export async function fetchAllStories() {
  const seen = new Set();
  const out = [];
  const pages = Math.ceil(MAX_STORIES / PAGE_SIZE);
  for (let page = 1; page <= pages; page++) {
    const data = await getJson(`/api/stories?page=${page}&page_size=${PAGE_SIZE}&sort_by=latest`);
    const items = data?.items || (Array.isArray(data) ? data : []);
    if (!items.length) break;
    for (const s of items) {
      if (!s?.slug || seen.has(s.slug)) continue;
      seen.add(s.slug);
      out.push(s);
    }
    if (items.length < PAGE_SIZE) break;
  }
  return out;
}
