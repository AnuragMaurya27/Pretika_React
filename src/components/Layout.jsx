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
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(3px)" }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      {!immersive && <Footer />}
      {showBottom && <BottomNav />}
    </div>
  );
}
