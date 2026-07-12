import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, CornerRightDown, ChevronDown } from "lucide-react";
import { post } from "../lib/api";
import { useFearStats } from "../lib/hooks";
import { STORAGE } from "../lib/constants";
import {
  darrSessionId, seenParagraphs, markSeen, reactedParagraphs, markReacted,
} from "../lib/darr";

/**
 * Darr Meter v3 — paragraph-level fear map for the reading experience
 * (reading stories only; chat stories have their own dread).
 *
 *  Invisible-until-it-matters layer:
 *  - One slim inline line under the episode meta (NO card, NO box): darr
 *    level 1–5 as filled ghosts (spice-level pattern — instantly readable),
 *    total darr count, "scariest — para N" jump link. Tapping the line
 *    expands a compact heat bar (progressive disclosure). Zero data → the
 *    line doesn't render at all.
 *  - Edge strip shaped like YouTube's "most replayed": scarier buckets bulge
 *    wider and hot ones breathe with an ember glow — self-explanatory, no
 *    legend needed. Plus a "you are here" wedge, a ghost at the peak, a real
 *    hover tooltip (title attrs are useless on mobile), and jump-flash so you
 *    see exactly where you landed.
 *  - One-time coach mark over the FAB teaches what the ghost button does.
 *  - Anticipation whisper ("something scary is coming…") when a community-hot
 *    paragraph is 1–3 paragraphs ahead.
 *  - Feedback after a tap: haptic + ghost particles + "you + N others" pill.
 *
 *  Plumbing (unchanged):
 *  - Stable sequential paragraph ids on the rendered `.reader-body` blocks;
 *    MutationObserver re-tags on innerHTML swaps.
 *  - IntersectionObserver → batched `views` events (reach tracking).
 *  - One darr per paragraph per session (server re-enforces).
 *
 * Everything overlays via portals so the reader's own layout and
 * page-transition wrappers stay untouched.
 */

const FLUSH_MS = 2500;
const PROOF_MIN_REACTIONS = 3;
const PROOF_MIN_RATE = 0.12;
const PROOF_MAX_CHIPS = 6;
const WHISPER_LOOKAHEAD = 3; // paragraphs ahead that trigger the dread whisper
// Long epics have hundreds of paragraphs — a per-paragraph map would render
// sub-pixel slivers (and the edge strip would overflow the viewport). Bucket
// like YouTube's "most replayed": each bucket shows its hottest paragraph.
const BAR_BUCKETS = 80;
const STRIP_BUCKETS = 100;

// Scared-ghost glyph — SVG so it renders identically on every OS. Shared body
// used both as a React node (FAB) and as a raw string (injected proof chips).
const GHOST_PATHS =
  '<path d="M12 2.6c-4 0-7 3.2-7 7.4v9.6c0 1 1.1 1.1 1.8.4.6-.6 1.5-.6 2.1 0 .6.7 1.6.7 2.2 0 .5-.6 1.4-.6 2 0 .6.7 1.6.7 2.2 0 .5-.6 1.5-.6 2.1 0 .7.7 1.6.6 1.6-.4V10c0-4.2-3-7.4-7-7.4z" fill="currentColor" opacity=".95"/>' +
  '<circle cx="9.2" cy="10" r="1.5" fill="#160806"/><circle cx="14.8" cy="10" r="1.5" fill="#160806"/>' +
  '<ellipse cx="12" cy="14.6" rx="2" ry="2.7" fill="#160806"/>';
const GHOST_SVG = (size = 26) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">${GHOST_PATHS}</svg>`;
function DarrGhost({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: GHOST_PATHS }} />
  );
}

/** fear_rate (relative to the story's scariest beat) → ember heat colour.
    Parchment-friendly ramp: warm sand → ember → crimson → dried blood. */
function heatColor(rate, maxRate) {
  if (!maxRate || rate <= 0) return "rgba(120,100,80,.16)";
  const t = Math.min(rate / maxRate, 1);
  return `hsl(${42 - 34 * t} ${62 + 16 * t}% ${72 - 42 * t}%)`;
}

const isHot = (s) =>
  !!s && s.total_reactions >= PROOF_MIN_REACTIONS && s.fear_rate >= PROOF_MIN_RATE;

export default function DarrMeter({ storyId, episodeId, contentKey }) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const { data: stats } = useFearStats(episodeId);
  const [paras, setParas] = useState([]); // DOM nodes, index = paragraph_id
  const [current, setCurrent] = useState(null);
  const [reacted, setReacted] = useState(() => reactedParagraphs(episodeId));
  const [bumps, setBumps] = useState({}); // optimistic {pid: totalReactions}
  const [burst, setBurst] = useState(0);
  // summary-card portal target — created once, attached to the DOM by 1b below
  const [summaryHost] = useState(() => {
    const el = document.createElement("div");
    el.className = "dm-summary-host";
    return el;
  });
  const [hint, setHint] = useState(null); // one pill above the FAB {kind, text}
  const [tip, setTip] = useState(null); // hover tooltip {y, x?, text} (strip + mini bar)
  const [mapOpen, setMapOpen] = useState(false); // inline mini heat map toggle
  const queueRef = useRef(new Set());
  const hintRef = useRef(null);
  const hintTimer = useRef(0);
  const whisperedRef = useRef(new Set()); // hot pids already whispered about
  const jumpingRef = useRef(0); // truthy while a map/strip jump scrolls past paragraphs
  const sessionId = useMemo(() => darrSessionId(), []);
  // NOTE: mounted with key={episodeId} in the Reader, so per-episode state is
  // fresh on remount — no reset effect needed.

  /* ── 1 · tag stable paragraph ids on the rendered content ──────────────────
     The reader owns `.reader-body` via dangerouslySetInnerHTML and may re-set
     it (re-render / react-query refetch), which drops our attributes and the
     node references. A MutationObserver re-tags on every such swap so paras
     always point at live nodes. Tagging is idempotent (index-based). */
  useEffect(() => {
    const body = document.querySelector(".reader-body");
    if (!body) return;

    let raf = 0;
    const retag = () => {
      raf = 0;
      const nodes = [...body.querySelectorAll("p, h1, h2, h3, h4, blockquote")]
        .filter((el) => el.textContent.trim().length > 0);
      if (!nodes.length) return;
      nodes.forEach((el, i) => {
        if (el.getAttribute("data-darr") !== String(i)) el.setAttribute("data-darr", String(i));
      });
      setParas((prev) =>
        prev.length === nodes.length && prev[0] === nodes[0] ? prev : nodes
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(retag);
    };

    retag();
    const mo = new MutationObserver((records) => {
      // ignore our own proof-host insertions to avoid a re-tag loop
      const meaningful = records.some((r) =>
        [...r.addedNodes, ...r.removedNodes].some(
          (n) => n.nodeType === 1 && !n.classList?.contains("dm-proof-host")
        )
      );
      if (meaningful) schedule();
    });
    mo.observe(body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      setParas([]);
    };
  }, [contentKey]);

  /* ── 1b · summary-card host, right before `.reader-body` ──────────────────
     Outside the observed subtree (no re-tag loops) and outside the dropcap
     scope, but still inside .rd-shell so the --rd-* theme vars apply. */
  useEffect(() => {
    if (!paras.length) return;
    const body = document.querySelector(".reader-body");
    if (!body) return;
    body.insertAdjacentElement("beforebegin", summaryHost);
    return () => summaryHost.remove();
  }, [paras.length > 0, summaryHost]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 2 · reach tracking + "current paragraph" band ─────────────────────── */
  useEffect(() => {
    if (!paras.length) return;
    const seen = seenParagraphs(episodeId);

    const viewObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const pid = Number(e.target.getAttribute("data-darr"));
          if (!seen.has(pid)) {
            seen.add(pid);
            queueRef.current.add(pid);
          }
          viewObs.unobserve(e.target); // once per session is enough
        }
      },
      { threshold: 0.5 }
    );
    // the paragraph crossing the middle band of the screen = current
    const bandObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setCurrent(Number(e.target.getAttribute("data-darr")));
        }
      },
      { rootMargin: "-38% 0px -52% 0px", threshold: 0 }
    );
    paras.forEach((el) => {
      viewObs.observe(el);
      bandObs.observe(el);
    });
    return () => {
      viewObs.disconnect();
      bandObs.disconnect();
    };
  }, [paras, episodeId]);

  /* ── 3 · batched flush of view events ──────────────────────────────────── */
  const flush = useCallback(() => {
    const ids = [...queueRef.current];
    if (!ids.length) return;
    queueRef.current.clear();
    markSeen(episodeId, ids);
    post("/darr-meter/views", {
      story_id: storyId,
      episode_id: episodeId,
      session_id: sessionId,
      paragraph_ids: ids,
    }).catch(() => {});
  }, [storyId, episodeId, sessionId]);

  useEffect(() => {
    const t = setInterval(flush, FLUSH_MS);
    const onHidden = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      clearInterval(t);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
      flush();
    };
  }, [flush]);

  /* ── 3b · the single hint slot above the FAB (coach / feedback / whisper) */
  const showHint = useCallback((kind, text, ms) => {
    clearTimeout(hintTimer.current);
    const h = { kind, text };
    hintRef.current = h;
    setHint(h);
    hintTimer.current = setTimeout(() => {
      hintRef.current = null;
      setHint(null);
    }, ms);
  }, []);
  const clearHint = useCallback(() => {
    clearTimeout(hintTimer.current);
    hintRef.current = null;
    setHint(null);
  }, []);
  useEffect(() => () => clearTimeout(hintTimer.current), []);

  // one-time coach mark — teaches what the ghost button is for
  useEffect(() => {
    if (!paras.length || localStorage.getItem(STORAGE.darrCoach)) return;
    const id = setTimeout(() => {
      localStorage.setItem(STORAGE.darrCoach, "1");
      showHint("coach", t("darr.coach"), 9000);
    }, 1600);
    return () => clearTimeout(id);
  }, [paras.length > 0, showHint, t]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 4 · the darr tap ──────────────────────────────────────────────────── */
  const statMap = useMemo(() => {
    const m = new Map();
    (stats || []).forEach((s) => m.set(s.paragraph_id, s));
    return m;
  }, [stats]);

  const totalFor = (pid) =>
    bumps[pid] ?? statMap.get(pid)?.total_reactions ?? 0;

  const canReact = current != null && !reacted.has(current);

  // anticipation — a community-hot paragraph is just ahead of the reader.
  // Skipped mid-jump: a map/strip jump sweeps `current` through paragraphs,
  // and firing then would burn the whisper while nobody can read it.
  useEffect(() => {
    if (current == null || hintRef.current || jumpingRef.current) return;
    for (let d = 1; d <= WHISPER_LOOKAHEAD; d++) {
      const pid = current + d;
      if (!isHot(statMap.get(pid))) continue;
      if (whisperedRef.current.has(pid)) return;
      whisperedRef.current.add(pid);
      showHint("whisper", t("darr.whisper"), 3400);
      return;
    }
  }, [current, statMap, showHint, t]);

  const react = () => {
    if (!canReact) return;
    const pid = current;
    const newTotal = totalFor(pid) + 1;
    markReacted(episodeId, pid);
    setReacted(new Set([...reacted, pid]));
    setBumps((b) => ({ ...b, [pid]: newTotal }));
    setBurst((n) => n + 1);
    navigator.vibrate?.(35);
    showHint(
      "reacted",
      newTotal > 1 ? t("darr.youPlus", { n: newTotal - 1 }) : t("darr.firstFear"),
      2800
    );
    flush(); // views pehle pahunch jayein — fear_rate kabhi >100% na dikhe
    post("/darr-meter/react", {
      story_id: storyId,
      episode_id: episodeId,
      session_id: sessionId,
      paragraph_id: pid,
    })
      .then((d) => {
        if (d?.total_reactions != null)
          setBumps((b) => ({ ...b, [pid]: d.total_reactions }));
        // pull fresh fear_rates so the map lights up where you just darr'd
        qc.invalidateQueries({ queryKey: ["darr-meter", episodeId] });
      })
      .catch(() => {});
  };

  /* ── 5 · social-proof chips under genuinely hot paragraphs ─────────────────
     Injected as plain DOM (server count is static text) so there's no extra
     React state/portal churn; cleaned up on unmount / content change. */
  useEffect(() => {
    if (!paras.length || !stats?.length) return;
    const hot = stats
      .filter((s) => s.total_reactions >= PROOF_MIN_REACTIONS && s.fear_rate >= PROOF_MIN_RATE)
      .sort((a, b) => b.fear_rate - a.fear_rate)
      .slice(0, PROOF_MAX_CHIPS);
    const created = [];
    hot.forEach((s) => {
      const node = paras[s.paragraph_id];
      if (!node || node.nextElementSibling?.classList.contains("dm-proof-host")) return;
      const host = document.createElement("div");
      host.className = "dm-proof-host";
      host.innerHTML =
        `<span class="dm-proof">${GHOST_SVG(13)}${t("darr.scaredHere", { n: s.total_reactions })}</span>`;
      node.insertAdjacentElement("afterend", host);
      created.push(host);
    });
    return () => created.forEach((h) => h.remove());
    // i18n.language: re-inject the chips in the new language on switch
  }, [paras, stats, t, i18n.language]);

  /* ── shared helpers for map/strip interactions ─────────────────────────── */
  const jumpTo = useCallback(
    (i) => {
      const el = paras[i];
      if (!el) return;
      setTip(null);
      clearTimeout(jumpingRef.current);
      jumpingRef.current = setTimeout(() => { jumpingRef.current = 0; }, 1600);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // flash starts late so a long smooth scroll doesn't outlive it — the
      // glow should still be burning when the reader lands
      setTimeout(() => {
        el.classList.add("dm-flash");
        setTimeout(() => el.classList.remove("dm-flash"), 1900);
      }, 550);
    },
    [paras]
  );

  /* ── render (portals only — the reader's DOM stays untouched) ──────────── */
  const len = paras.length;

  const maxRate = Math.max(0, ...(stats || []).map((s) => s.fear_rate));

  // paragraph range → buckets; each bucket carries its hottest paragraph so a
  // single scary beat inside a 400-paragraph epic still shows up full-strength
  const bucketize = useCallback(
    (count) => {
      const n = Math.min(len, count);
      if (!n) return [];
      const out = [];
      for (let b = 0; b < n; b++) {
        const start = Math.floor((b * len) / n);
        const end = Math.max(start + 1, Math.floor(((b + 1) * len) / n));
        let rate = 0, hotPid = start, hotCount = 0;
        for (let i = start; i < end; i++) {
          const r = statMap.get(i)?.fear_rate || 0;
          if (r > rate) rate = r;
          const c = bumps[i] ?? statMap.get(i)?.total_reactions ?? 0;
          if (c > hotCount) { hotCount = c; hotPid = i; }
        }
        out.push({ start, rate, hotPid, hotCount });
      }
      return out;
    },
    [len, statMap, bumps]
  );
  const barBuckets = useMemo(() => bucketize(BAR_BUCKETS), [bucketize]);
  const stripBuckets = useMemo(() => bucketize(STRIP_BUCKETS), [bucketize]);

  // horizontal fear map as one gradient (cheap at any story length)
  const mapGradient = useMemo(() => {
    const n = barBuckets.length;
    if (!n) return null;
    const stops = barBuckets.map(
      (bk, b) =>
        `${heatColor(bk.rate, maxRate)} ${((b / n) * 100).toFixed(2)}% ${(((b + 1) / n) * 100).toFixed(2)}%`
    );
    return `linear-gradient(90deg, ${stops.join(",")})`;
  }, [barBuckets, maxRate]);

  if (!len) return null;

  // bucket → the paragraph a tap should land on + the caption it should show
  const bucketTarget = (bk) => (bk.hotCount > 0 ? bk.hotPid : bk.start);
  const bucketCaption = (bk) =>
    bk.hotCount > 0
      ? t("darr.hoverInfo", { n: bk.hotPid + 1, c: bk.hotCount })
      : t("darr.hoverNone", { n: bk.start + 1 });

  // total fears (optimistic bumps override the server rows they duplicate)
  const counted = new Set();
  let totalAll = 0;
  (stats || []).forEach((s) => {
    counted.add(s.paragraph_id);
    totalAll += bumps[s.paragraph_id] ?? s.total_reactions ?? 0;
  });
  Object.entries(bumps).forEach(([pid, v]) => {
    if (!counted.has(Number(pid))) totalAll += v;
  });

  // darr level 1–5 (spice-level pattern) — from the scariest paragraph that
  // has real volume behind it; thin data (1–2 taps) shows count only, no level
  const qualified = (stats || []).filter((s) => s.total_reactions >= PROOF_MIN_REACTIONS);
  const peakQRate = Math.max(0, ...qualified.map((s) => s.fear_rate));
  const level = !qualified.length ? 0
    : peakQRate >= 0.45 ? 5 : peakQRate >= 0.32 ? 4 : peakQRate >= 0.2 ? 3 : peakQRate >= 0.1 ? 2 : 1;
  // "scariest" pulls from the same qualified pool as the level (a lone tap on
  // a barely-read paragraph shouldn't outrank a beat 3+ readers feared)
  const peakPool = qualified.length ? qualified : (stats || []).filter((s) => s.total_reactions > 0);
  const peak = peakPool.reduce((best, s) => (!best || s.fear_rate > best.fear_rate ? s : best), null);
  const pct = (i) => `${(((i + 0.5) / len) * 100).toFixed(2)}%`;
  const currentTotal = current != null ? totalFor(current) : 0;
  const hauntNow = canReact && isHot(statMap.get(current));

  const barBucketFromEvent = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - r.left;
    const n = barBuckets.length;
    return barBuckets[Math.max(0, Math.min(n - 1, Math.floor((x / r.width) * n)))];
  };

  return (
    <>
      {/* ── slim darr line — no card, no box; nothing at all without data ── */}
      {summaryHost && totalAll > 0 &&
        createPortal(
          <div className="dm-inline">
            <div className="dm-line-wrap">
              <button
                className="dm-line"
                onClick={() => setMapOpen((v) => !v)}
                aria-expanded={mapOpen}
                aria-label={t("darr.heatmap")}
              >
                <span className="dm-line-name">
                  <DarrGhost size={13} /> {t("darr.title")}
                </span>
                {level > 0 && (
                  <span className="dm-lvl" title={`${level}/5`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={`dm-lvl-g${i <= level ? " on" : ""}`}>
                        <DarrGhost size={11} />
                      </span>
                    ))}
                    <b className="dm-lvl-txt">{t(`darr.lvl${level}`)}</b>
                  </span>
                )}
                <span className="dm-line-dim">· {t("darr.fears", { n: totalAll })}</span>
                <ChevronDown size={14} className={`dm-line-chev${mapOpen ? " open" : ""}`} />
              </button>
              {peak && peak.paragraph_id < len && (
                <button className="dm-line-peak" onClick={() => jumpTo(peak.paragraph_id)}>
                  <Flame size={12} /> {t("darr.peakShort", { n: peak.paragraph_id + 1 })}
                  <CornerRightDown size={11} />
                </button>
              )}
            </div>

            {/* progressive disclosure — the map appears only when asked for */}
            {mapOpen && (
              <div className="dm-mini">
                <div
                  className="dm-bar"
                  style={{ background: mapGradient }}
                  role="img"
                  aria-label={t("darr.heatmap")}
                  onClick={(e) => jumpTo(bucketTarget(barBucketFromEvent(e)))}
                  onMouseMove={(e) =>
                    setTip({ x: e.clientX, y: e.clientY - 14, text: bucketCaption(barBucketFromEvent(e)) })
                  }
                  onMouseLeave={() => setTip(null)}
                />
                {peak && peak.paragraph_id < len && (
                  <span className="dm-bar-peak" style={{ left: pct(peak.paragraph_id) }} aria-hidden="true">
                    <DarrGhost size={11} />
                  </span>
                )}
                {current != null && (
                  <span
                    className="dm-bar-you"
                    style={{ left: pct(current) }}
                    title={t("darr.youAreHere")}
                    aria-hidden="true"
                  />
                )}
              </div>
            )}
          </div>,
          summaryHost
        )}

      {createPortal(
        <>
          {/* heatmap strip — YouTube "most replayed" ki shape, par darr ke
              liye: scarier bucket = wider bulge; hot ones breathe an ember
              glow. Self-explanatory — no legend needed. */}
          {len >= 4 && (
            <>
              <div className="dm-strip" aria-label={t("darr.heatmap")} onMouseLeave={() => setTip(null)}>
                {stripBuckets.map((bk, b) => {
                  const heat = maxRate ? Math.min(bk.rate / maxRate, 1) : 0;
                  const hot = bk.hotCount >= PROOF_MIN_REACTIONS && bk.rate >= PROOF_MIN_RATE;
                  return (
                    <button
                      key={b}
                      className={`dm-seg${hot ? " hot" : ""}`}
                      style={{
                        background: heatColor(bk.rate, maxRate),
                        "--w": `${3 + Math.round(9 * heat)}px`,
                      }}
                      aria-label={t("darr.jumpTo", { n: bucketTarget(bk) + 1 })}
                      onMouseEnter={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setTip({ y: r.top + r.height / 2, text: bucketCaption(bk) });
                      }}
                      onClick={() => jumpTo(bucketTarget(bk))}
                    />
                  );
                })}
              </div>
              {/* markers live outside the strip so its overflow never clips them */}
              <div className="dm-strip-marks" aria-hidden="true">
                {peak && peak.paragraph_id < len && (
                  <span className="dm-mark-peak" style={{ top: pct(peak.paragraph_id) }}>
                    <DarrGhost size={10} />
                  </span>
                )}
                {current != null && <span className="dm-mark-you" style={{ top: pct(current) }} />}
              </div>
            </>
          )}

          {/* shared tooltip — anchored right of the strip, or at the cursor
              when it comes from the inline mini bar (tip.x set) */}
          {tip && (
            <div
              className={`dm-tip${tip.x != null ? " float" : ""}`}
              style={tip.x != null ? { top: tip.y, left: tip.x } : { top: tip.y }}
              aria-hidden="true"
            >
              {tip.text}
            </div>
          )}

          {/* floating darr button */}
          <div className="dm-fab-wrap">
            {hint && (
              <button
                key={hint.kind + hint.text}
                className={`dm-hint ${hint.kind}`}
                onClick={clearHint}
                aria-live="polite"
              >
                {(hint.kind === "coach" || hint.kind === "whisper") && <DarrGhost size={14} />}
                <span>{hint.text}</span>
              </button>
            )}
            {burst > 0 && (
              <span key={burst} className="dm-plus1" aria-hidden="true">+1</span>
            )}
            {burst > 0 &&
              [0, 1, 2].map((k) => (
                <span
                  key={`${burst}-${k}`}
                  className="dm-spook"
                  style={{ "--dx": `${[-20, 4, 18][k]}px`, animationDelay: `${k * 70}ms` }}
                  aria-hidden="true"
                >
                  <DarrGhost size={12} />
                </span>
              ))}
            <button
              className={`dm-fab ${canReact ? "ready pulse-glow" : "spent"}${hauntNow ? " haunt" : ""}`}
              onClick={react}
              disabled={!canReact}
              aria-label={canReact ? t("darr.fabReady") : t("darr.fabSpent")}
            >
              <DarrGhost />
              {/* "गिन लिया" only when THIS paragraph was actually darr'd —
                  before any paragraph is active the ghost just waits */}
              <span className="dm-fab-label">
                {current != null && reacted.has(current) ? t("darr.counted") : t("darr.darr")}
              </span>
            </button>
            {currentTotal > 0 && (
              <span className="dm-fab-count">{currentTotal}</span>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
