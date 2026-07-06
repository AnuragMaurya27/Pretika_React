import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { post } from "../lib/api";
import { useFearStats } from "../lib/hooks";
import {
  darrSessionId, seenParagraphs, markSeen, reactedParagraphs, markReacted,
} from "../lib/darr";

/**
 * Darr Meter — paragraph-level fear heatmap for the reading experience
 * (reading stories only; chat stories have their own dread).
 *
 *  - Tags the rendered `.reader-body` block elements with stable sequential
 *    paragraph ids (same content → same ids, every session).
 *  - IntersectionObserver → batched `views` events (reach tracking).
 *  - Floating darr button reacts to the paragraph currently being read;
 *    one tap per paragraph per session (server re-enforces).
 *  - Right-edge heatmap strip (green→red by fear_rate) — visible from the
 *    moment the story opens, click jumps to that paragraph.
 *  - Social-proof chips under genuinely hot paragraphs.
 *
 * Everything overlays via portals to <body> so the reader's own layout and
 * page-transition wrappers stay untouched.
 */

const FLUSH_MS = 2500;
const PROOF_MIN_REACTIONS = 3;
const PROOF_MIN_RATE = 0.12;
const PROOF_MAX_CHIPS = 6;

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

/** fear_rate (relative to the story's scariest beat) → heat colour */
function heatColor(rate, maxRate) {
  if (!maxRate || rate <= 0) return "rgba(120,100,80,.18)";
  const t = Math.min(rate / maxRate, 1);
  return `hsl(${130 - 130 * t} 62% ${46 - t * 6}%)`;
}

export default function DarrMeter({ storyId, episodeId, contentKey }) {
  const { data: stats } = useFearStats(episodeId);
  const [paras, setParas] = useState([]); // DOM nodes, index = paragraph_id
  const [current, setCurrent] = useState(null);
  const [reacted, setReacted] = useState(() => reactedParagraphs(episodeId));
  const [bumps, setBumps] = useState({}); // optimistic {pid: totalReactions}
  const [burst, setBurst] = useState(0);
  const queueRef = useRef(new Set());
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
    window.addEventListener("pagehide", flush);
    return () => {
      clearInterval(t);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  /* ── 4 · the darr tap ──────────────────────────────────────────────────── */
  const statMap = useMemo(() => {
    const m = new Map();
    (stats || []).forEach((s) => m.set(s.paragraph_id, s));
    return m;
  }, [stats]);

  const totalFor = (pid) =>
    bumps[pid] ?? statMap.get(pid)?.total_reactions ?? 0;

  const canReact = current != null && !reacted.has(current);

  const react = () => {
    if (!canReact) return;
    const pid = current;
    markReacted(episodeId, pid);
    setReacted(new Set([...reacted, pid]));
    setBumps((b) => ({ ...b, [pid]: totalFor(pid) + 1 }));
    setBurst((n) => n + 1);
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
        `<span class="dm-proof">${GHOST_SVG(13)}${s.total_reactions} log yahan dare the</span>`;
      node.insertAdjacentElement("afterend", host);
      created.push(host);
    });
    return () => created.forEach((h) => h.remove());
  }, [paras, stats]);

  /* ── render (portals only — the reader's DOM stays untouched) ──────────── */
  if (!paras.length) return null;

  const maxRate = Math.max(0, ...(stats || []).map((s) => s.fear_rate));
  const currentTotal = current != null ? totalFor(current) : 0;

  return (
    <>
      {createPortal(
        <>
          {/* heatmap strip — YouTube "most replayed", par darr ke liye */}
          {paras.length >= 4 && (
            <div className="dm-strip" aria-label="Darr Meter heatmap">
              {paras.map((_, i) => {
                const s = statMap.get(i);
                const rate = s?.fear_rate || 0;
                return (
                  <button
                    key={i}
                    className="dm-seg"
                    style={{ background: heatColor(rate, maxRate) }}
                    title={
                      s?.total_reactions
                        ? `${s.total_reactions} log yahan dare (${Math.round(rate * 100)}%)`
                        : `Paragraph ${i + 1}`
                    }
                    aria-label={`Jump to paragraph ${i + 1}`}
                    onClick={() =>
                      paras[i]?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                  />
                );
              })}
            </div>
          )}

          {/* floating darr button */}
          <div className="dm-fab-wrap">
            {burst > 0 && (
              <span key={burst} className="dm-plus1" aria-hidden="true">+1</span>
            )}
            <button
              className={`dm-fab ${canReact ? "ready pulse-glow" : "spent"}`}
              onClick={react}
              disabled={!canReact}
              aria-label={
                canReact
                  ? "Yahan darr laga — tap karo"
                  : "Is paragraph pe aapka darr count ho chuka hai"
              }
            >
              <DarrGhost />
              <span className="dm-fab-label">{canReact ? "DARR!" : "COUNTED"}</span>
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
