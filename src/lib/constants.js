// Central config — same backend the Flutter app uses.
export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://pretika-api-1.onrender.com";

// SharedPreferences-equivalent keys (kept identical to the Flutter app)
export const STORAGE = {
  token: "jwt_token",
  refresh: "refresh_token",
  userId: "user_id",
  user: "pretika_user",
  lang: "pretika_app_language",
  langChosen: "pretika_language_chosen",
  tourDone: "pretika_tour_done",
};

/**
 * Convert any image path from the API into a full URL.
 * Mirrors AppConstants.mediaUrl() in the Flutter app:
 *  - relative path        → BASE_URL + path
 *  - self-hosted absolute → strip host, use current BASE_URL
 *  - external CDN         → return as-is
 */
export function mediaUrl(path) {
  if (!path) return "";
  if (!path.startsWith("http://") && !path.startsWith("https://")) {
    return `${BASE_URL}${path}`;
  }
  try {
    const u = new URL(path);
    // u.hostname strips any port (e.g. "localhost:8080" → "localhost") so legacy
    // self-hosted URLs saved in the DB get rewritten to the current BASE_URL.
    const host = u.hostname;
    const selfHosted =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith("onrender.com") ||
      host.includes("hauntedvoice.in");
    if (selfHosted) return `${BASE_URL}${u.pathname}`;
  } catch {
    /* ignore */
  }
  return path;
}

// Deterministic free Unsplash fallback art for stories without a thumbnail.
const HORROR_IMG = [
  "photo-1509248961158-e54f6934749c",
  "photo-1505635552518-3448ff116af3",
  "photo-1518791841217-8f162f1e1131",
  "photo-1572550054419-9b76b8a9b1f1",
  "photo-1478760329108-5c3ed9d495a0",
  "photo-1504457047772-27faf1c00561",
  "photo-1518709268805-4e9042af9f23",
  "photo-1534447677768-be436bb09401",
  "photo-1525351484163-7529414344d8",
  "photo-1543096222-72de739f7917",
];
export function fallbackThumb(seed = "") {
  let h = 0;
  for (let i = 0; i < String(seed).length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const id = HORROR_IMG[h % HORROR_IMG.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=70`;
}

export function thumbFor(path, seed) {
  const m = mediaUrl(path);
  return m || fallbackThumb(seed);
}
