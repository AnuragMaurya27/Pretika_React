#!/usr/bin/env node
/**
 * generate-sitemap.mjs — writes public/sitemap.xml from the live Pretika API.
 *
 * Includes: static pages, every published story (/story/:slug, with lastmod +
 * cover image), every category (/explore?category=slug) and every creator
 * profile (/u/:username) seen in the story list.
 *
 * Never fails the build: on API errors it keeps an existing sitemap.xml, or
 * falls back to the static routes only. Run standalone with `npm run sitemap`.
 * Override the API with SITEMAP_API_BASE (defaults to the hosted API, since
 * the sitemap is for the production site).
 */
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ORIGIN = "https://pretika.in";
const API = (process.env.SITEMAP_API_BASE || "https://pretika-api-1.onrender.com").replace(/\/$/, "");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sitemap.xml");
const MAX_STORIES = 2000;
const PAGE_SIZE = 50;

const STATIC_ROUTES = [
  { loc: "/home", changefreq: "daily", priority: "1.0" },
  { loc: "/explore", changefreq: "daily", priority: "0.9" },
  { loc: "/about", changefreq: "monthly", priority: "0.5" },
  { loc: "/contact", changefreq: "monthly", priority: "0.4" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
  { loc: "/terms", changefreq: "yearly", priority: "0.3" },
];

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// The Render free tier cold-starts (~60s), so retry patiently.
async function getJson(path, tries = 4) {
  const url = `${API}${path}`;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      return body && typeof body === "object" && "data" in body ? body.data : body; // unwrap envelope
    } catch (e) {
      if (i === tries) throw e;
      console.log(`  retry ${i}/${tries - 1} for ${path} (${e.message}) — API may be cold-starting…`);
      await new Promise((r) => setTimeout(r, 8000 * i));
    }
  }
}

// Mirrors mediaUrl() in src/lib/constants.js: legacy self-hosted absolute URLs
// (localhost, old onrender hosts) stored in the DB get rewritten to the API.
function mediaUrl(path) {
  if (!path) return null;
  if (!/^https?:\/\//.test(path)) return `${API}${path.startsWith("/") ? "" : "/"}${path}`;
  try {
    const u = new URL(path);
    const selfHosted =
      u.hostname === "localhost" || u.hostname === "127.0.0.1" ||
      u.hostname.endsWith("onrender.com") || u.hostname.includes("hauntedvoice.in");
    if (selfHosted) return `${API}${u.pathname}`;
  } catch { /* fall through */ }
  return path;
}

function isoDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function buildXml(urls) {
  const hasImages = urls.some((u) => u.image);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ""}>`,
  ];
  for (const u of urls) {
    lines.push("  <url>");
    lines.push(`    <loc>${esc(ORIGIN + u.loc)}</loc>`);
    if (u.lastmod) lines.push(`    <lastmod>${u.lastmod}</lastmod>`);
    if (u.changefreq) lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
    if (u.priority) lines.push(`    <priority>${u.priority}</priority>`);
    if (u.image) {
      lines.push("    <image:image>");
      lines.push(`      <image:loc>${esc(u.image)}</image:loc>`);
      if (u.imageTitle) lines.push(`      <image:title>${esc(u.imageTitle)}</image:title>`);
      lines.push("    </image:image>");
    }
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  return lines.join("\n") + "\n";
}

async function main() {
  const urls = [...STATIC_ROUTES];
  let dynamicOk = false;

  try {
    console.log(`Fetching categories from ${API} …`);
    const cats = (await getJson("/api/stories/categories")) || [];
    for (const c of cats) {
      if (c?.slug && (c.total_stories ?? 0) > 0) {
        urls.push({ loc: `/explore?category=${c.slug}`, changefreq: "daily", priority: "0.8" });
      }
    }
    console.log(`  ${cats.length} categories`);

    console.log("Fetching stories …");
    const seenSlugs = new Set();
    const creators = new Map(); // username -> latest activity date
    for (let page = 1; page <= Math.ceil(MAX_STORIES / PAGE_SIZE); page++) {
      const data = await getJson(`/api/stories?page=${page}&page_size=${PAGE_SIZE}&sort_by=latest`);
      const items = data?.items || (Array.isArray(data) ? data : []);
      if (!items.length) break;
      for (const s of items) {
        if (!s?.slug || seenSlugs.has(s.slug)) continue;
        seenSlugs.add(s.slug);
        const lastmod = isoDate(s.updated_at || s.published_at || s.created_at);
        urls.push({
          loc: `/story/${s.slug}`,
          lastmod,
          changefreq: "weekly",
          priority: "0.8",
          image: mediaUrl(s.thumbnail_url),
          imageTitle: s.title,
        });
        if (s.creator_username && !creators.has(s.creator_username)) creators.set(s.creator_username, lastmod);
      }
      if (items.length < PAGE_SIZE) break;
    }
    console.log(`  ${seenSlugs.size} stories`);

    for (const [username, lastmod] of creators) {
      urls.push({ loc: `/u/${encodeURIComponent(username)}`, lastmod, changefreq: "weekly", priority: "0.6" });
    }
    console.log(`  ${creators.size} creator profiles`);
    dynamicOk = true;
  } catch (e) {
    console.warn(`⚠ Could not fetch dynamic URLs (${e.message}).`);
    if (existsSync(OUT) && readFileSync(OUT, "utf8").includes("/story/")) {
      console.warn("  Keeping the existing sitemap.xml (it already has story URLs).");
      return;
    }
    console.warn("  Writing static-routes-only sitemap instead.");
  }

  writeFileSync(OUT, buildXml(urls));
  console.log(`✓ Wrote ${OUT} — ${urls.length} URLs${dynamicOk ? "" : " (static only)"}`);
}

main().catch((e) => {
  console.warn(`⚠ sitemap generation skipped: ${e.message}`);
  process.exitCode = 0; // never fail the build
});
