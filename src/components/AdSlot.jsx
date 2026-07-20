import { useEffect, useRef, useMemo } from "react";
import { ADSENSE_CLIENT, adsEnabled, loadAdSense } from "../lib/ads";

/**
 * AdSense display slot (spec 4.4 / 10). Renders NOTHING until
 * VITE_ADSENSE_CLIENT is set (post-approval), so the ad layer is a safe
 * no-op today.
 *
 * Placement rules live at the call sites:
 *  - free chapters + browse pages only; paid/unlocked chapters are ad-free
 *  - no ads on login / wallet / payment / KYC pages
 *  - no ads on 18+/graphic stories (AdSense shocking-content policy)
 */
export default function AdSlot({ slot, format = "auto", style }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!adsEnabled() || pushed.current) return;
    loadAdSense();
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch { /* blocked — fine */ }
  }, []);

  if (!adsEnabled()) return null;

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", minHeight: 90, margin: "18px 0", ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot || undefined}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}

/**
 * Chapter body with in-article ads interleaved every `interval` paragraphs,
 * capped at `maxAds` (spec 4.4). When ads are off this renders the exact same
 * single-container markup the Reader always used.
 */
export function AdInterleavedContent({ html, enabled, interval = 7, maxAds = 3, className, style }) {
  const segments = useMemo(() => {
    if (!enabled || !adsEnabled() || !html) return null;
    const paras = html.split(/<\/p>/i).filter((p) => p.trim());
    if (paras.length < interval * 2) return null; // too short — don't break the flow
    const out = [];
    let buf = [];
    let ads = 0;
    paras.forEach((p, i) => {
      buf.push(`${p}</p>`);
      const atBoundary = (i + 1) % interval === 0;
      // never place an ad after the final paragraph run
      if (atBoundary && ads < maxAds && i < paras.length - 2) {
        out.push({ html: buf.join(""), ad: true });
        buf = [];
        ads += 1;
      }
    });
    if (buf.length) out.push({ html: buf.join(""), ad: false });
    return out;
  }, [html, enabled, interval, maxAds]);

  if (!segments) {
    return (
      <div className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  return (
    <>
      {segments.map((seg, i) => (
        <div key={i}>
          <div
            // dropcap styling belongs to the opening paragraph only
            className={i === 0 ? className : className?.replace("dropcap", "").trim()}
            style={style}
            dangerouslySetInnerHTML={{ __html: seg.html }}
          />
          {seg.ad && <AdSlot format="fluid" />}
        </div>
      ))}
    </>
  );
}
