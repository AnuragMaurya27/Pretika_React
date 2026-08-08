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
 * Override the API with PRETIKA_API_BASE (defaults to the production origin).
 *
 * Shared fetch/format helpers live in ./lib/pretika-api.mjs (also used by the
 * prerender step) so the API base + envelope handling stay in one place.
 */
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { API, ORIGIN, esc, isoDate, mediaUrl, fetchCategories, fetchAllStories } from "./lib/pretika-api.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sitemap.xml");

const STATIC_ROUTES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/explore", changefreq: "daily", priority: "0.9" },
  { loc: "/about", changefreq: "monthly", priority: "0.5" },
  { loc: "/contact", changefreq: "monthly", priority: "0.4" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
  { loc: "/terms", changefreq: "yearly", priority: "0.3" },
];

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
    const cats = await fetchCategories();
    for (const c of cats) {
      if (c?.slug && (c.total_stories ?? 0) > 0) {
        urls.push({ loc: `/explore?category=${c.slug}`, changefreq: "daily", priority: "0.8" });
      }
    }
    console.log(`  ${cats.length} categories`);

    console.log("Fetching stories …");
    const stories = await fetchAllStories();
    const creators = new Map(); // username -> latest activity date
    for (const s of stories) {
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
    console.log(`  ${stories.length} stories`);

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
