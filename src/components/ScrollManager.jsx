import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Per-history-entry scroll positions. Module-level so it survives the page
// remounts Layout's <AnimatePresence> does on every navigation.
const scrollPositions = new Map();

/**
 * ScrollManager — remembers where you were on each page.
 *
 * React Router (with <Routes>, not a data router) has no built-in scroll
 * restoration, and Layout fully remounts the page on every navigation, so the
 * window always snapped to the top — leaving a page and returning felt like a
 * fresh reload. This records scrollY per history entry and:
 *   - restores it on back/forward (POP)
 *   - scrolls to the top on a fresh navigation (PUSH/REPLACE)
 *
 * A single persistent listener keeps the *live* scroll in a ref; on each
 * navigation we stash that ref under the OUTGOING key inside a layout effect —
 * i.e. before we reset/restore scroll — so the reset-to-top can never clobber
 * the position we're trying to save. The immersive reader (`/read/...`) owns
 * its own scroll (resume-by-progress), so we leave it alone there.
 */
export default function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType(); // "POP" | "PUSH" | "REPLACE"
  const managed = !location.pathname.startsWith("/read/");

  const liveScroll = useRef(0);            // latest window.scrollY
  const activeKey = useRef(location.key);  // history entry currently on screen

  // One persistent listener records the live scroll into a ref.
  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    const onScroll = () => { liveScroll.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On every navigation: stash the outgoing page's scroll, then place the new
  // one. useLayoutEffect runs before paint, so the save reads the pre-reset
  // value and the restore lands as early as possible.
  useLayoutEffect(() => {
    if (activeKey.current !== location.key) {
      scrollPositions.set(activeKey.current, liveScroll.current); // save where we left
      activeKey.current = location.key;
    }
    if (!managed) return;

    const target = navType === "POP" ? scrollPositions.get(location.key) ?? 0 : 0;
    liveScroll.current = target;

    let raf = 0;
    const deadline = performance.now() + 1200; // retry until content/data lands
    const apply = () => {
      window.scrollTo(0, target);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // keep retrying while the incoming page isn't tall enough to reach target
      if (target > 0 && maxScroll < target - 1 && performance.now() < deadline) {
        raf = requestAnimationFrame(apply);
      }
    };
    // let the incoming page mount past the AnimatePresence exit (mode="wait")
    const t = setTimeout(() => { raf = requestAnimationFrame(apply); }, 40);
    return () => {
      clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return null;
}
