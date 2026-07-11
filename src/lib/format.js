import i18n from "../i18n";

// Compact number: 1200 -> 1.2K, 1500000 -> 1.5M
export function compact(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(v % 1_000 ? 1 : 0) + "K";
  return String(v);
}

export function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return i18n.t("time.justNow");
  const m = Math.floor(s / 60);
  if (m < 60) return i18n.t("time.m", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return i18n.t("time.h", { n: h });
  const days = Math.floor(h / 24);
  if (days < 30) return i18n.t("time.d", { n: days });
  const mo = Math.floor(days / 30);
  if (mo < 12) return i18n.t("time.mo", { n: mo });
  return i18n.t("time.y", { n: Math.floor(mo / 12) });
}

// Reader fear ranks → level + xp range (icons live in Art.jsx <RankIcon>, no emoji)
export const READER_RANKS = {
  raat_ka_musafir: { level: 1, min: 0, max: 499 },
  andheri_gali_explorer: { level: 2, min: 500, max: 1499 },
  shamshaan_premi: { level: 3, min: 1500, max: 3999 },
  horror_bhakt: { level: 4, min: 4000, max: 9999 },
  mahakaal_bhakt: { level: 5, min: 10000, max: Infinity },
};

export function rankProgress(score, rank) {
  const r = READER_RANKS[rank] || READER_RANKS.raat_ka_musafir;
  if (r.max === Infinity) return 1;
  const span = r.max - r.min + 1;
  return Math.min(1, Math.max(0, (Number(score || 0) - r.min) / span));
}
