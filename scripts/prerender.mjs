#!/usr/bin/env node
/**
 * prerender.mjs — runs AFTER `vite build`, turning the single SPA shell
 * (dist/index.html) into per-route static HTML for crawlers.
 *
 * Why: Pretika is a client-rendered SPA, so Googlebot's first fetch of a story
 * page gets the generic homepage <title>/description and an empty <div id=root>.
 * Every story looked identical (and content-less) to search engines, so none
 * got indexed. Here we bake, per story/creator, the real <title>, description,
 * canonical, Open Graph, Article JSON-LD AND a visible <h1> + summary into the
 * served HTML. React still boots and replaces #root for real users, so the
 * interactive app is unchanged — this only fills the pre-JS shell.
 *
 * Output: dist/story/<slug>/index.html and dist/u/<username>/index.html.
 * nginx must serve these via `try_files $uri $uri/ /index.html;` (the `$uri/`
 * makes /story/<slug> resolve to /story/<slug>/index.html before the SPA
 * fallback). No headless browser is involved — just the live API + string
 * templating, so it runs fast and reliably in CI.
 *
 * Never fails the build: any error is logged and the build continues (real
 * users are unaffected; only the crawler shell is missing).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ORIGIN, esc, mediaUrl, fetchAllStories, fetchFreeEpisodesProse, htmlToText } from "./lib/pretika-api.mjs";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const TEMPLATE = join(DIST, "index.html");
const DEFAULT_IMAGE = `${ORIGIN}/og-cover.jpg`;

// ── head-tag rewriters (operate on the built index.html string) ───────────────
const reMeta = (attr, key) =>
  new RegExp(`(<meta ${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" content=")[^"]*(")`);

function setMeta(html, attr, key, content) {
  const re = reMeta(attr, key);
  if (re.test(html)) return html.replace(re, `$1${esc(content)}$2`);
  return html.replace("</head>", `    <meta ${attr}="${key}" content="${esc(content)}" />\n  </head>`);
}
function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
}
function setCanonical(html, url) {
  const re = /(<link rel="canonical" href=")[^"]*(")/;
  if (re.test(html)) return html.replace(re, `$1${esc(url)}$2`);
  return html.replace("</head>", `    <link rel="canonical" href="${esc(url)}" />\n  </head>`);
}
function injectHead(html, snippet) {
  return html.replace("</head>", `${snippet}\n  </head>`);
}
// JSON-LD safe for inlining in a <script> (never break out with </script>)
function ldScript(obj) {
  const json = JSON.stringify(obj).replace(/</g, "\\u003c");
  return `    <script type="application/ld+json">${json}</script>`;
}
// Replace the boot-loader region (between the PRERENDER markers in index.html)
// with real, crawlable content. React clears #root on mount, so users never
// see this once the JS bundle loads.
function setBody(html, inner) {
  const re = /<!--PRERENDER_CONTENT-->[\s\S]*?<!--\/PRERENDER_CONTENT-->/;
  if (!re.test(html)) {
    console.warn("  ⚠ PRERENDER markers not found in index.html — skipping body injection.");
    return html;
  }
  return html.replace(re, `<!--PRERENDER_CONTENT-->${inner}<!--/PRERENDER_CONTENT-->`);
}

function write(routePath, html) {
  const dir = join(DIST, routePath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

// ── page builders ─────────────────────────────────────────────────────────────
// `prose` (optional) = { title, episodeNumber, wordCount, totalEpisodes, html }
// for the first free episode. When present, the real chapter text is baked into
// the crawlable shell so /story/<slug> is a substantial article, not a stub.
function storyHtml(template, s, prose) {
  const slug = s.slug;
  const url = `${ORIGIN}/story/${slug}`;
  const title = s.title || "Hindi Horror Story";
  const fullTitle = `${title} · Pretika`;
  const desc = (s.summary || `${title} — read this spine-chilling Hindi horror story on Pretika.`).slice(0, 200);
  const img = mediaUrl(s.thumbnail_url, ORIGIN) || DEFAULT_IMAGE;
  const author = s.creator_display_name || s.creator_username || "Pretika";
  const category = s.category_name || "Horror";
  const tags = Array.isArray(s.tags) ? s.tags.filter(Boolean) : [];
  const keywords = [title, category, ...tags, "hindi horror story", "डरावनी कहानी", "bhootiya kahani"]
    .filter(Boolean)
    .join(", ");

  let html = template;
  html = setTitle(html, fullTitle);
  html = setMeta(html, "name", "description", desc);
  html = setMeta(html, "name", "keywords", keywords);
  html = setCanonical(html, url);
  html = setMeta(html, "property", "og:type", "article");
  html = setMeta(html, "property", "og:title", fullTitle);
  html = setMeta(html, "property", "og:description", desc);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "property", "og:image", img);
  html = setMeta(html, "name", "twitter:title", fullTitle);
  html = setMeta(html, "name", "twitter:description", desc);
  html = setMeta(html, "name", "twitter:image", img);

  const published = s.published_at || s.created_at;
  const modified = s.updated_at || published;
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: title,
    name: title,
    description: desc,
    image: img,
    url,
    inLanguage: "hi",
    genre: category,
    ...(tags.length ? { keywords: tags.join(", ") } : {}),
    isAccessibleForFree: true,
    ...(prose
      ? {
          articleBody: htmlToText(prose.chapters.map((c) => c.html).join("\n\n")).slice(0, 5000),
          ...(prose.wordCount ? { wordCount: prose.wordCount } : {}),
        }
      : {}),
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    author: { "@type": "Person", name: author, url: `${ORIGIN}/u/${s.creator_username}` },
    publisher: {
      "@type": "Organization",
      name: "Pretika",
      url: ORIGIN,
      logo: { "@type": "ImageObject", url: `${ORIGIN}/favicon.svg` },
    },
    ...(s.average_rating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(s.average_rating).toFixed(1),
            ratingCount: s.rating_count || 1,
            bestRating: 5,
          },
        }
      : {}),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/home` },
      { "@type": "ListItem", position: 2, name: category, item: `${ORIGIN}/explore` },
      { "@type": "ListItem", position: 3, name: title, item: url },
    ],
  };

  let headExtra = "";
  if (published) headExtra += `    <meta property="article:published_time" content="${esc(published)}" />\n`;
  if (modified) headExtra += `    <meta property="article:modified_time" content="${esc(modified)}" />\n`;
  headExtra += ldScript(article) + "\n" + ldScript(breadcrumb);
  html = injectHead(html, headExtra);

  // The actual first free chapter, baked in as readable prose (the whole point:
  // /story/<slug> becomes a real article for crawlers, not a summary stub).
  const multi = prose && prose.totalEpisodes > 1;
  // Per-chapter heading for multi-part stories — but don't double-prefix a title
  // that already leads with "भाग 2" / "Episode 2" / "Part 2".
  const chapterHeading = (ch) => {
    const t = (ch.title || "").trim();
    if (!multi) return "";
    if (/^(भाग|एपिसोड|part|episode|ep\.?)\s*\d+/i.test(t)) return t;
    return `भाग ${ch.episodeNumber}: ${t}`;
  };
  const proseBlock = prose
    ? `
      <div aria-hidden style="width:64px;height:2px;background:#a91607;opacity:.5;margin:30px auto 18px"></div>
      ${prose.chapters
        .map((ch) => {
          const h = chapterHeading(ch);
          return `${h ? `<h2 style="font-size:21px;line-height:1.3;color:#1e0a0c;margin:34px 0 16px">${esc(h)}</h2>` : ""}
      <div class="pk-prose" style="font-size:17px;line-height:1.95;color:#2a1410">${ch.html}</div>`;
        })
        .join("\n")}
      ${prose.truncated ? `<p style="font-size:13.5px;color:#8a6a5a;margin:22px 0 0">…आगे के भाग Pretika पर पढ़ें।</p>` : ""}`
    : "";
  const ctaLabel = prose
    ? `Pretika पर और डरावनी कहानियाँ &rarr;`
    : `पूरी कहानी पढ़ें · Read the full story on Pretika &rarr;`;

  const body = `
    <main id="pk-prerender" style="max-width:760px;margin:0 auto;padding:40px 22px;background:#f4efe4;color:#2a1410;font-family:'Noto Serif Devanagari',Georgia,'Times New Roman',serif;line-height:1.85;min-height:100vh">
      <p style="font-size:13px;margin:0 0 6px"><a href="/home" style="color:#a91607;text-decoration:none">Pretika</a> &rsaquo; <a href="/explore" style="color:#a91607;text-decoration:none">${esc(category)}</a></p>
      <h1 style="font-size:30px;line-height:1.25;margin:.2em 0 .3em;color:#1e0a0c">${esc(title)}</h1>
      <p style="font-size:14px;color:#6b4a3a;margin:0 0 20px">${esc(author)} &middot; ${esc(category)} &middot; Hindi Horror Story (डरावनी कहानी)</p>
      ${img ? `<img src="${esc(img)}" alt="${esc(title)}" width="560" style="max-width:100%;height:auto;border-radius:14px;margin-bottom:22px" />` : ""}
      <p style="font-size:17px;margin:0 0 20px">${esc(desc)}</p>
      ${tags.length ? `<p style="font-size:13px;color:#8a6a5a;margin:0 0 22px">${tags.map((t) => esc("#" + t)).join(" &nbsp; ")}</p>` : ""}
      ${proseBlock}
      <p style="margin:30px 0 0"><a href="/story/${esc(slug)}" style="color:#fff;background:#a91607;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">${ctaLabel}</a></p>
    </main>`;
  html = setBody(html, body);

  return html;
}

function creatorHtml(template, username, stories) {
  const url = `${ORIGIN}/u/${username}`;
  const name = stories[0]?.creator_display_name || username;
  const fullTitle = `${name} · Pretika`;
  const desc = `Hindi horror stories by ${name} on Pretika — ${stories.length} spine-chilling ${
    stories.length === 1 ? "tale" : "tales"
  } (डरावनी कहानियाँ). Read free.`.slice(0, 200);
  const img = mediaUrl(stories[0]?.creator_avatar_url, ORIGIN) || DEFAULT_IMAGE;

  let html = template;
  html = setTitle(html, fullTitle);
  html = setMeta(html, "name", "description", desc);
  html = setCanonical(html, url);
  html = setMeta(html, "property", "og:type", "profile");
  html = setMeta(html, "property", "og:title", fullTitle);
  html = setMeta(html, "property", "og:description", desc);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "property", "og:image", img);
  html = setMeta(html, "name", "twitter:title", fullTitle);
  html = setMeta(html, "name", "twitter:description", desc);
  html = setMeta(html, "name", "twitter:image", img);

  const ld = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name,
      url,
      ...(stories[0]?.creator_avatar_url ? { image: img } : {}),
    },
  };
  html = injectHead(html, ldScript(ld));

  const items = stories
    .slice(0, 50)
    .map(
      (s) =>
        `<li style="margin:0 0 8px"><a href="/story/${esc(s.slug)}" style="color:#a91607;text-decoration:none">${esc(
          s.title
        )}</a></li>`
    )
    .join("");
  const body = `
    <main id="pk-prerender" style="max-width:760px;margin:0 auto;padding:40px 22px;background:#f4efe4;color:#2a1410;font-family:'Noto Serif Devanagari',Georgia,serif;line-height:1.8;min-height:100vh">
      <h1 style="font-size:28px;margin:0 0 6px;color:#1e0a0c">${esc(name)}</h1>
      <p style="font-size:14px;color:#6b4a3a;margin:0 0 20px">Horror-story creator on Pretika · ${stories.length} ${
        stories.length === 1 ? "story" : "stories"
      }</p>
      <ul style="list-style:none;padding:0;margin:0;font-size:17px">${items}</ul>
    </main>`;
  html = setBody(html, body);

  return html;
}

// The home / default SPA shell is empty for a non-JS crawler. Bake a linked list
// of the latest stories into it so the site's entry point (and every route that
// falls back to index.html) presents real, crawlable content. React clears #root
// on boot, so this is crawler-only — the live home page is unchanged.
function homeHtml(template, stories) {
  let html = setCanonical(template, `${ORIGIN}/home`);
  const items = stories
    .slice(0, 48)
    .map((s) => {
      const cat = esc(s.category_name || "Horror");
      const brief = esc((s.summary || "").slice(0, 120));
      return `<li style="margin:0 0 15px"><a href="/story/${esc(s.slug)}" style="color:#a91607;text-decoration:none;font-weight:700;font-size:17px">${esc(
        s.title || "Hindi Horror Story"
      )}</a><div style="font-size:13px;color:#6b4a3a;margin-top:2px">${cat}${brief ? ` — ${brief}` : ""}</div></li>`;
    })
    .join("");
  const body = `
    <main id="pk-prerender" style="max-width:760px;margin:0 auto;padding:40px 22px;background:#f4efe4;color:#2a1410;font-family:'Noto Serif Devanagari',Georgia,serif;line-height:1.8;min-height:100vh">
      <h1 style="font-size:30px;margin:0 0 8px;color:#1e0a0c">Pretika — हिंदी हॉरर कहानियाँ · Hindi Horror Stories</h1>
      <p style="font-size:16px;color:#4a2c22;margin:0 0 26px">डरावनी भूतिया कहानियाँ पढ़ें, सुनें और लिखें। Read, listen to and write spine-chilling Hindi horror stories (डरावनी कहानियाँ) on Pretika.</p>
      <h2 style="font-size:20px;color:#1e0a0c;margin:0 0 16px">नई कहानियाँ · Latest stories</h2>
      <ul style="list-style:none;padding:0;margin:0">${items}</ul>
    </main>`;
  return setBody(html, body);
}

async function main() {
  if (!existsSync(TEMPLATE)) {
    console.warn(`⚠ prerender skipped: ${TEMPLATE} not found (run after \`vite build\`).`);
    return;
  }
  const template = readFileSync(TEMPLATE, "utf8");
  if (!template.includes("PRERENDER_CONTENT")) {
    console.warn("⚠ index.html has no <!--PRERENDER_CONTENT--> markers — head tags will still be baked, body won't.");
  }

  const stories = await fetchAllStories();
  console.log(`Prerendering ${stories.length} stories …`);
  let n = 0;
  let withProse = 0;
  const byCreator = new Map();
  for (const s of stories) {
    if (!s.slug) continue;
    // Pull every free chapter's real text so the page is the full story, not a
    // stub. Sequential calls keep the live API un-hammered; failures return null
    // and the page falls back to its summary — the build never breaks.
    const prose = await fetchFreeEpisodesProse(s.id);
    if (prose) withProse++;
    write(`story/${s.slug}`, storyHtml(template, s, prose));
    n++;
    if (s.creator_username) {
      if (!byCreator.has(s.creator_username)) byCreator.set(s.creator_username, []);
      byCreator.get(s.creator_username).push(s);
    }
  }
  console.log(`  ✓ ${n} story pages (${withProse} with full story prose)`);

  let c = 0;
  for (const [username, list] of byCreator) {
    if (!username || username.includes("/")) continue;
    write(`u/${username}`, creatorHtml(template, username, list));
    c++;
  }
  console.log(`  ✓ ${c} creator pages`);

  // Enrich the home / fallback shell last (story pages were already written from
  // the in-memory template, so overwriting dist/index.html doesn't affect them).
  if (stories.length) {
    writeFileSync(TEMPLATE, homeHtml(template, stories));
    console.log(`  ✓ home shell enriched with ${Math.min(stories.length, 48)} latest stories`);
  }
  console.log(`✓ Prerender done — ${n + c} static HTML files under dist/`);
}

main().catch((e) => {
  console.warn(`⚠ prerender skipped: ${e.message}`);
  process.exitCode = 0; // never fail the build — real users are unaffected
});
