import { Outlet, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";
import Footer from "./Footer";
import ScrollManager from "./ScrollManager";

// Tab routes get the mobile bottom nav; detail/reader/creator screens don't.
const TAB_ROUTES = ["/home", "/explore", "/profile"];

export default function Layout() {
  const location = useLocation();
  const reduce = useReducedMotion();
  const showBottom = TAB_ROUTES.includes(location.pathname);
  // Keep the reader fully immersive — no site nav, no footer, just the story.
  const immersive = location.pathname.startsWith("/read/");

  return (
    <div className="app-shell">
      <ScrollManager />
      {!immersive && <DesktopNav />}
      {/* Enter-only page transition — a plain keyed motion.div, deliberately NOT
          wrapped in <AnimatePresence mode="wait">. That combo intermittently left
          the incoming page mounted at its `initial` opacity:0 on back/forward (POP)
          navigation and never fired the enter animation, so the page looked blank
          until a manual refresh (React 19 + framer-motion 12). A keyed motion.div
          remounts on every navigation and reliably animates in; the key change
          still gives ScrollManager its per-route remount.
          NOTE: no `filter` here — a resting `filter: blur(0px)` stays inline and
          makes the wrapper a containing block/composited layer, which traps
          position:fixed children and glitches the sticky mobile header. Plain
          opacity + y settles to transform:none, so sticky/fixed work normally. */}
      <motion.div
        key={location.pathname}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Outlet />
      </motion.div>
      {!immersive && <Footer />}
      {showBottom && <BottomNav />}
    </div>
  );
}
