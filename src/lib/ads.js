// AdSense loader + gating (spec 4.4 / 10). No-op until VITE_ADSENSE_CLIENT is
// set post-approval. All ad code stays behind hasConsent() so an EU consent
// banner can gate it later without touching call sites.

export const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || "";

function hasConsent() {
  return true; // India-focused v1 (spec 10) — consent banner hook point
}

export function adsEnabled() {
  return !!ADSENSE_CLIENT && hasConsent();
}

let scriptLoaded = false;
export function loadAdSense() {
  if (scriptLoaded || !adsEnabled()) return;
  scriptLoaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}
