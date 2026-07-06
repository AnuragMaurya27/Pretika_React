import { useEffect } from "react";

const SITE = "Pretika";
const ORIGIN = "https://pretika.in";
const DEFAULT_DESC =
  "Pretika — India's home for spine-chilling Hindi horror stories (डरावनी भूतिया कहानियाँ). Read, write & feel the fear.";
const DEFAULT_IMAGE = `${ORIGIN}/og-cover.jpg`;
const DEFAULT_ROBOTS = "index, follow, max-image-preview:large";
const DEFAULT_KEYWORDS =
  "hindi horror stories, डरावनी कहानियां, भूतिया कहानी, bhootiya kahani, chudail ki kahani, " +
  "real horror stories in hindi, ghost stories india, haunted stories, pretika";

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (content == null) {
    // set-or-remove semantics so SPA navigation never leaves stale tags behind
    if (el && el.dataset.seo === "route") el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.dataset.seo = "route";
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Seo — updates the document <title>, description, canonical, robots, Open
 * Graph & Twitter tags per route. No dependency (react-helmet not installed);
 * just patches <head> on mount. Optional `jsonLd` injects structured data
 * (object or array of objects).
 *
 *   <Seo title="…" description="…" image="…" path="/story/foo" type="article"
 *        robots="noindex, follow" keywords="a, b" publishedTime="…" />
 *
 * Every tag is (re)written on each route so SPA navigation away from a
 * noindex/article page always restores the indexable defaults.
 */
export default function Seo({
  title,
  description,
  image,
  path = "",
  type = "website",
  robots = DEFAULT_ROBOTS,
  keywords,
  publishedTime,
  modifiedTime,
  jsonLd,
}) {
  const fullTitle = title ? `${title} · ${SITE}` : `${SITE} · Hindi Horror Stories`;
  const url = `${ORIGIN}${path}`;
  const desc = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMAGE;

  useEffect(() => {
    document.title = fullTitle;
    setMeta("name", "description", desc);
    setMeta("name", "robots", robots);
    setMeta("name", "keywords", keywords || DEFAULT_KEYWORDS);
    setLink("canonical", url);

    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", url);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:image", img);
    setMeta("property", "og:image:alt", title || `${SITE} — Hindi horror stories`);
    // article:* only exist on article pages; removed again elsewhere
    setMeta("property", "article:published_time", type === "article" ? publishedTime : null);
    setMeta("property", "article:modified_time", type === "article" ? modifiedTime : null);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", img);

    let script;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seo = "route";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => {
      if (script) script.remove();
    };
  }, [fullTitle, desc, img, url, type, robots, keywords, publishedTime, modifiedTime, jsonLd, title]);

  return null;
}
