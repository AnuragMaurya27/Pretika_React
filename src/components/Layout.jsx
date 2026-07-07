import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
      {/* NOTE: no `filter` in this transition. A resting `filter: blur(0px)` on
          the wrapper stays inline forever and makes it a containing block +
          composited layer — which traps position:fixed children AND makes the
          sticky mobile header glitch during scroll (content bleeds above it).
          Plain opacity + y settles to a clean wrapper (transform:none), so
          sticky/fixed work normally. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      {!immersive && <Footer />}
      {showBottom && <BottomNav />}
    </div>
  );
}
