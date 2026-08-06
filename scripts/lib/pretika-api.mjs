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

// ── episode prose (for the prerenderer) ───────────────────────────────────────
// Faithful Node port of src/lib/content.js#renderEpisode so the text baked into
// the crawlable /story/<slug> shell matches, character-for-character, what a real
// reader sees in the app. Handles the three stored formats: Quill delta (JSON),
// already-HTML, and plain text.
const escText = (s = "") =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function deltaToHtml(ops) {
  let html = "";
  let line = "";
  const flush = (block = "p", attrs = {}) => {
    if (!line.trim() && block === "p") { html += "<br/>"; line = ""; return; }
    let tag = block;
    if (attrs.header) tag = `h${attrs.header}`;
    if (attrs.blockquote) tag = "blockquote";
    html += `<${tag}>${line}</${tag}>`;
    line = "";
  };
  for (const op of ops) {
    if (op && typeof op.insert === "object" && op.insert.image) {
      html += `<img src="${mediaUrl(op.insert.image, ORIGIN)}" alt="" />`;
      continue;
    }
    const text = String(op?.insert ?? "");
    const a = op?.attributes || {};
    const parts = text.split("\n");
    parts.forEach((part, idx) => {
      let chunk = escText(part);
      if (a.bold) chunk = `<strong>${chunk}</strong>`;
      if (a.italic) chunk = `<em>${chunk}</em>`;
      if (a.underline) chunk = `<u>${chunk}</u>`;
      line += chunk;
      if (idx < parts.length - 1) flush("p", op?.attributes || {});
    });
  }
  if (line) html += `<p>${line}</p>`;
  return html;
}

export function renderProse(content) {
  if (!content) return "";
  const trimmed = String(content).trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      const ops = Array.isArray(parsed) ? parsed : parsed.ops;
      if (Array.isArray(ops)) return deltaToHtml(ops);
    } catch { /* not delta */ }
  }
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) return trimmed; // already HTML
  return trimmed
    .split(/\n{2,}/)
    .map((p) => `<p>${escText(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

// Plain-text extraction for JSON-LD articleBody (tags stripped, entities decoded).
export function htmlToText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|blockquote|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Fetches the first FREE, published episode's rendered prose for a story so the
// prerenderer can bake a real, substantial article into /story/<slug> — instead
// of just the 160-char summary (the AdSense "low value content" fix). Two calls:
// the episode list, then that episode's content. Never throws — SEO must not
// break the build; on any failure we return null and the page keeps its summary.
export async function fetchFirstFreeEpisode(storyId) {
  if (!storyId) return null;
  try {
    const data = await getJson(`/api/stories/${storyId}/episodes`);
    const eps = Array.isArray(data) ? data : data?.items || [];
    const first = eps
      .filter((e) => e && e.status === "published" && (e.access_type === "free" || e.is_unlocked))
      .sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0))[0];
    if (!first?.id) return null;
    const full = await getJson(`/api/stories/${storyId}/episodes/${first.id}`);
    const html = renderProse(full?.content);
    if (!html) return null;
    return {
      title: first.title || "",
      episodeNumber: first.episode_number || 1,
      wordCount: first.word_count || 0,
      totalEpisodes: eps.length,
      html,
    };
  } catch (e) {
    console.log(`  ⚠ prose fetch failed for story ${storyId}: ${e.message}`);
    return null;
  }
}
