import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, Minus, Plus, Heart, CheckCircle2,
  Type, Sun, SunDim, MoonStar, Play,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { get, post, del, errMsg } from "../lib/api";
import { useEpisode, useCompleteEpisode, useRateEpisode } from "../lib/hooks";
import { renderEpisode } from "../lib/content";
import { saveProgress, getProgress } from "../lib/reading";
import { ErrorState } from "../components/EmptyState";
import StarRating from "../components/StarRating";
import CommentSection from "../components/CommentSection";
import DarrMeter from "../components/DarrMeter";
import Seo from "../components/Seo";
import { Spook, PageLoader } from "../components/Art";
import { useAuth } from "../store/auth";

const THEMES = [
  { key: "parchment", labelKey: "reader.themeParchment", Icon: Sun, bg: "#f4efe4", fg: "#211913" },
  { key: "sepia", labelKey: "reader.themeSepia", Icon: SunDim, bg: "#efe2c8", fg: "#3d2c1c" },
  { key: "midnight", labelKey: "reader.themeMidnight", Icon: MoonStar, bg: "#0e0907", fg: "#e7d9c4" },
];

export default function Reader() {
  const { storyId, episodeId } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();
  const authed = useAuth((s) => s.isAuthed)();
  const reduce = useReducedMotion();

  const { data: ep, isLoading, isError, refetch } = useEpisode(storyId, episodeId);
  const { data: epList } = useQuery({
    queryKey: ["episode-list", storyId],
    queryFn: () => get(`/stories/${storyId}/episodes`),
    enabled: !!storyId,
  });
  // story meta — for the reading-history entry
  const { data: story } = useQuery({
    queryKey: ["story-meta", storyId],
    queryFn: () => get(`/stories/id/${storyId}`),
    enabled: !!storyId,
    staleTime: 1000 * 60 * 5,
  });

  const complete = useCompleteEpisode();
  const rateEpisode = useRateEpisode(storyId);

  // ── reading preferences (persisted) ───────────────────────────────────────
  const [fs, setFs] = useState(() => Number(localStorage.getItem("reader_fs")) || 17);
  const [theme, setTheme] = useState(() => localStorage.getItem("reader_theme") || "parchment");
  const [font, setFont] = useState(() => localStorage.getItem("reader_font") || "serif");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [progress, setProgress] = useState(0);
  const [barHidden, setBarHidden] = useState(false);
  const [liked, setLiked] = useState(false);
  const [done, setDone] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const lastY = useRef(0);

  useEffect(() => {
    if (!ep) return;
    setLiked(!!ep.is_liked);
    setDone(false);
    setMyRating(ep.user_rating || 0);
    setBarHidden(false);
    // Resume exactly where the reader left this episode; fresh episodes start
    // at the top. Two timed passes: the first lands right after layout, the
    // second corrects once fonts/images have settled scrollHeight.
    const saved = getProgress(storyId);
    const pct = saved?.episode_id === episodeId ? saved.scroll_percentage || 0 : 0;
    if (pct > 2 && pct < 96) {
      const restore = () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        if (max > 0) window.scrollTo({ top: (max * pct) / 100, behavior: "instant" });
      };
      const t1 = setTimeout(restore, 50);
      const t2 = setTimeout(restore, 350);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id]);
  useEffect(() => { localStorage.setItem("reader_fs", String(fs)); }, [fs]);
  useEffect(() => { localStorage.setItem("reader_theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("reader_font", font); }, [font]);

  const { html } = useMemo(() => renderEpisode(ep?.content), [ep?.content]);

  const sorted = useMemo(() => (epList || []).slice().sort((a, b) => a.episode_number - b.episode_number), [epList]);
  const idx = sorted.findIndex((e) => e.id === episodeId);
  const next = idx >= 0 ? sorted[idx + 1] : null;
  const prev = idx > 0 ? sorted[idx - 1] : null;

  // ── reading progress → localStorage (mirrors the Flutter reader) ──────────
  const persist = (extra = {}) => {
    if (!ep) return;
    saveProgress(storyId, {
      story_title: story?.title,
      story_slug: story?.slug,
      thumbnail_url: story?.thumbnail_url,
      episode_id: episodeId,
      episode_number: ep.episode_number,
      episode_title: ep.title,
      ...extra,
    });
  };
  // record that the story was opened (so it appears in history). Re-opening the
  // same episode keeps its real scroll_percentage; a different episode starts
  // its progress fresh (the old episode's % must not leak onto the new one).
  useEffect(() => {
    if (!ep || !story) return;
    const saved = getProgress(storyId);
    const sameEp = saved?.episode_id === episodeId;
    persist(sameEp ? {} : { scroll_percentage: 0, is_completed: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id, story?.id]);

  const finish = () => {
    if (done) return;
    setDone(true);
    persist({ scroll_percentage: 100, is_completed: true });
    // award +25 reader XP server-side (once); only for logged-in readers
    if (authed) {
      complete.mutate({ storyId, episodeId }, {
        onSuccess: () => { setCelebrate(true); setTimeout(() => setCelebrate(false), 1800); },
        onError: () => { /* already completed / not logged in — still show local done state */ },
      });
    } else {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1800);
    }
  };

  // throttled scroll tracking → progress % + auto-hide chrome
  useEffect(() => {
    if (!ep) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const doc = document.documentElement;
        const y = doc.scrollTop || window.scrollY;
        const max = doc.scrollHeight - doc.clientHeight;
        const pct = max > 0 ? Math.min(100, Math.round(y / max * 100)) : 0;
        setProgress(pct);
        // hide bar scrolling down (immersion), reveal scrolling up
        if (y > lastY.current + 6 && y > 160) setBarHidden(true);
        else if (y < lastY.current - 6) setBarHidden(false);
        lastY.current = y;
        if (pct >= 90 && !done) finish(); // auto-complete near the end
        persist({ scroll_percentage: pct });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id, story?.id, done]);

  const toggleLike = () => {
    if (!authed) { toast.error(t("toast.loginRequired")); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    (wasLiked ? del(`/stories/${storyId}/episodes/${episodeId}/like`)
      : post(`/stories/${storyId}/episodes/${episodeId}/like`)).catch((e) => {
        setLiked(wasLiked); toast.error(errMsg(e));
      });
  };

  const rate = (n) => {
    if (!authed) { toast.error(t("toast.loginRequired")); return; }
    setMyRating(n);
    rateEpisode.mutate({ episodeId, rating: n }, {
      onSuccess: () => toast.success(t("reader.rateThanks")),
      onError: (e) => { setMyRating(ep?.user_rating || 0); toast.error(errMsg(e)); },
    });
  };

  const epAccessible = (e) => e && (e.access_type === "free" || e.is_unlocked || e.content);
  const goNext = useCallback(() => {
    if (next && epAccessible(next)) nav(`/read/${storyId}/${next.id}`);
    else nav(-1);
  }, [next, storyId, nav]);
  const goPrev = useCallback(() => {
    if (prev && epAccessible(prev)) nav(`/read/${storyId}/${prev.id}`);
  }, [prev, storyId, nav]);

  // keyboard reading — ← / → move between episodes (desktop delight)
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowRight" && next && epAccessible(next)) goNext();
      if (e.key === "ArrowLeft" && prev) goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, next, prev]);

  if (isLoading) return <div className="app-shell"><PageLoader minHeight="90dvh" /></div>;
  if (isError || !ep) return <div className="app-shell"><ErrorState onRetry={refetch} /></div>;

  const mins = Math.max(1, Math.round((ep.estimated_read_time_seconds || 0) / 60));
  const minsLeft = Math.max(0, Math.ceil(mins * (1 - progress / 100)));

  return (
    <div className="rd-shell" data-rdtheme={theme}>
      <Seo
        title={`${story?.title ? `${story.title} — ` : ""}Episode ${ep.episode_number}: ${ep.title}`}
        description={`Read episode ${ep.episode_number} of ${story?.title || "this Hindi horror story"} on Pretika${story?.summary ? ` — ${story.summary.slice(0, 110)}` : ""}.`}
        path={`/read/${storyId}/${episodeId}`}
        type="article"
        // premium/locked episodes have no readable content — keep them out of the index
        robots={ep.content ? undefined : "noindex, follow"}
      />
      {/* candle-lit vignette (midnight only) */}
      <div className="rd-vignette" aria-hidden />

      {/* ── Top chrome — auto-hides while you sink into the story ─────────── */}
      <header className={`rd-bar ${barHidden ? "hidden" : ""}`}>
        <div className="between container" style={{ height: 54, gap: 8 }}>
          <button className="rd-iconbtn" onClick={() => nav(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <div className="clamp-1" style={{ fontWeight: 700, fontSize: 13.5 }}>
              {t("story.episode")} {ep.episode_number} · {ep.title}
            </div>
            {story?.title && (
              <div className="clamp-1" style={{ fontSize: 10.5, color: "var(--rd-faint)", letterSpacing: 0.4 }}>{story.title}</div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button
              className={`rd-iconbtn ${settingsOpen ? "on" : ""}`}
              onClick={() => setSettingsOpen((v) => !v)}
              aria-label={t("reader.settings")}
            >
              <Type size={19} />
            </button>
            <AnimatePresence>
              {settingsOpen && (
                <>
                  <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setSettingsOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 35 }}
                  />
                  <motion.div
                    key="pop"
                    className="rd-pop"
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: "top right" }}
                  >
                    {/* text size */}
                    <div className="rd-pop-label">{t("reader.fontSize")}</div>
                    <div className="rd-seg">
                      <button onClick={() => setFs((f) => Math.max(14, f - 1))} aria-label="smaller"><Minus size={16} /></button>
                      <span style={{ flex: 1.2, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15 }}>{fs}</span>
                      <button onClick={() => setFs((f) => Math.min(26, f + 1))} aria-label="bigger"><Plus size={16} /></button>
                    </div>
                    {/* typeface */}
                    <div className="rd-pop-label">{t("reader.font")}</div>
                    <div className="rd-seg">
                      <button className={font === "serif" ? "on" : ""} onClick={() => setFont("serif")}>
                        <span className="rd-serif" style={{ fontSize: 15 }}>अ</span> {t("reader.fontSerif")}
                      </button>
                      <button className={font === "sans" ? "on" : ""} onClick={() => setFont("sans")}>
                        <span style={{ fontSize: 15 }}>अ</span> {t("reader.fontSans")}
                      </button>
                    </div>
                    {/* atmosphere */}
                    <div className="rd-pop-label">{t("reader.theme")}</div>
                    <div className="rd-seg">
                      {THEMES.map(({ key, labelKey, Icon, bg, fg }) => (
                        <button
                          key={key}
                          className={`rd-swatch ${theme === key ? "on" : ""}`}
                          onClick={() => setTheme(key)}
                          style={{ background: bg, color: fg }}
                        >
                          <span style={{ display: "grid", placeItems: "center", gap: 3 }}>
                            <Icon size={16} />
                            <span style={{ fontSize: 10.5 }}>{t(labelKey)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* reading progress */}
        <div style={{ height: 2.5, background: "transparent" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "linear-gradient(90deg, var(--crimson-mid), var(--rd-accent))",
            transition: "width .12s linear", boxShadow: "0 0 10px color-mix(in srgb, var(--rd-accent) 60%, transparent)",
          }} />
        </div>
      </header>

      {/* floating % + time-left pill */}
      <div className="rd-pct" style={{ opacity: progress > 2 && progress < 99 ? 1 : 0 }}>
        {progress}% · {t("reader.timeLeft", { n: minsLeft })}
      </div>

      <motion.article
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: "var(--reader-max)", margin: "0 auto", padding: "78px 20px 56px" }}
      >
        <div className="eyebrow" style={{ color: "var(--rd-accent)", fontSize: 11 }}>
          {story?.category_name || "Pretika"} · {t("story.episode")} {ep.episode_number}
        </div>
        <h1 className="serif" style={{ fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 800, lineHeight: 1.22, marginTop: 10 }}>{ep.title}</h1>
        <div style={{ fontSize: 12.5, marginTop: 8, color: "var(--rd-faint)" }}>
          {mins} {t("story.readTime")} · {ep.word_count || 0} words
        </div>

        <Ornament />

        <div
          className={`reader-body dropcap ${font === "serif" ? "rd-serif" : ""}`}
          style={{ fontSize: fs, lineHeight: 2, color: "var(--rd-text)", transition: "font-size .2s ease" }}
          dangerouslySetInnerHTML={{ __html: html || `<p class="muted">${t("common.nothingHere")}</p>` }}
        />

        {/* ── The End flourish ─────────────────────────────────────────────── */}
        <div className="rd-end">
          <Ornament wide />
          <span className="display">{t("reader.theEnd")}</span>
        </div>

        {/* Footer actions */}
        <div className="row gap-10" style={{ marginTop: 20 }}>
          <button className={`rd-btn ${liked ? "on" : ""}`} onClick={toggleLike}>
            <Heart size={18} fill={liked ? "var(--rd-accent)" : "none"} /> {t("story.like")}
          </button>
          {!done && (
            <button className="rd-btn" onClick={finish}>
              <CheckCircle2 size={18} /> {t("reader.finish")}
            </button>
          )}
        </div>

        {/* Episode rating — revealed after finishing */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="rd-card" style={{ padding: 18, marginTop: 18, textAlign: "center" }}
            >
              <div className="badge badge-green" style={{ margin: "0 auto" }}>{t("reader.finished")}</div>
              <div style={{ fontWeight: 700, fontSize: 14, margin: "12px 0 10px" }}>{t("reader.rateEpisode")}</div>
              <div className="row" style={{ justifyContent: "center" }}>
                <StarRating value={myRating} onRate={rate} size={32} disabled={rateEpisode.isPending} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Up next — cinematic hand-off into the next episode ───────────── */}
        {next && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: 22 }}
          >
            <div className="rd-pop-label" style={{ margin: "0 0 8px" }}>{t("reader.upNext")}</div>
            <button className="rd-card rd-next" onClick={goNext}>
              <span style={nextNum}>{next.episode_number}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="clamp-1" style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{next.title}</span>
                <span style={{ fontSize: 12, color: "var(--rd-faint)" }}>
                  {Math.max(1, Math.round((next.estimated_read_time_seconds || 0) / 60))} {t("story.readTime")}
                </span>
              </span>
              <span style={nextPlay}><Play size={16} fill="currentColor" /></span>
            </button>
          </motion.div>
        )}
        {prev && (
          <button onClick={goPrev} className="row gap-4" style={{ margin: "16px auto 0", fontSize: 13, fontWeight: 600, color: "var(--rd-faint)" }}>
            <ArrowLeft size={14} /> {t("reader.prev")}: {prev.title}
          </button>
        )}

        {/* ── Episode discussion — this episode's comments only ────────────── */}
        <div style={{ marginTop: 34, borderTop: "1px solid var(--rd-border)" }}>
          <CommentSection
            key={episodeId}
            storyId={storyId}
            episodeId={episodeId}
            creatorId={story?.creator_id}
          />
        </div>
      </motion.article>

      {/* Darr Meter — paragraph-level fear heatmap (reading stories only).
          key={episodeId} → fresh per-episode dedup/heatmap state on navigation. */}
      {ep.content && (
        <DarrMeter key={episodeId} storyId={storyId} episodeId={episodeId} contentKey={ep.id} />
      )}

      {/* XP celebration */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", zIndex: 90, pointerEvents: "none" }}
          >
            <motion.div
              initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              style={{ textAlign: "center", background: "#160404", color: "#fff", padding: "26px 34px", borderRadius: 20, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}
            >
              <div style={{ display: "grid", placeItems: "center" }}><Spook size={58} tone="light" /></div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>+25 XP</div>
              <div style={{ fontSize: 12, color: "#cda3a3" }}>{t("reader.finished")}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Small SVG fleuron divider — identical on every OS (no glyph/emoji drift). */
function Ornament({ wide }) {
  return (
    <div className="ornament" style={{ margin: wide ? "0 0 4px" : "18px 0", width: "100%" }} aria-hidden>
      <svg width="46" height="12" viewBox="0 0 46 12" fill="none" style={{ flexShrink: 0 }}>
        <path d="M23 1 L26.5 6 L23 11 L19.5 6 Z" fill="currentColor" opacity=".9" />
        <circle cx="10" cy="6" r="1.6" fill="currentColor" opacity=".55" />
        <circle cx="36" cy="6" r="1.6" fill="currentColor" opacity=".55" />
      </svg>
    </div>
  );
}

const nextNum = {
  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
  display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16,
  background: "color-mix(in srgb, var(--rd-accent) 12%, transparent)", color: "var(--rd-accent)",
};
const nextPlay = {
  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
  display: "grid", placeItems: "center",
  background: "var(--rd-accent)", color: "#fff",
  boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--rd-accent) 70%, transparent)",
};

