import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Plus, MessageCircle, Search, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

// Mobile tab bar — Home · Feed · [Write FAB] · Explore · Chats.
// Profile lives in the top-right header now (next to notifications), not here.
// The left and right tab groups are each flex:1 (equal width) with the Write
// FAB pinned as a fixed-width centre column between them, so the FAB always
// stays dead-centre regardless of how many tabs each side holds.
const leftTabs = [
  { to: "/home", icon: Home, id: "home" },
  { to: "/feed", icon: Sparkles, id: "feed" },
];
const rightTabs = [
  { to: "/explore", icon: Search, id: "explore" },
  { to: "/chat", icon: MessageCircle, id: "messages" },
];

export default function BottomNav() {
  const { t } = useTranslation();
  const nav = useNavigate();
  return (
    <nav className="only-mobile bnav">
      <div style={{ display: "flex", height: 58 }}>
        <div style={{ flex: 1, display: "flex" }}>
          {leftTabs.map((tab) => (
            <Tab key={tab.id} {...tab} t={t} />
          ))}
        </div>

        {/* Write FAB — the create-story button, a fixed-width centre column
            between two equal (flex:1) tab groups so its circle always lands at
            the exact horizontal centre of the bar. The circle floats above the
            bar and the label is pinned to the bar's bottom edge so it can never
            slip under the safe-area / get clipped. */}
        <button onClick={() => nav("/creator/story/new")} style={fabWrap} aria-label={t("nav.write")}>
          <motion.div whileTap={{ scale: 0.88 }} className="pulse-glow" style={fabCircle}>
            <Plus size={22} color="#fff" />
          </motion.div>
          <span style={fabLabel}>{t("nav.write")}</span>
        </button>

        <div style={{ flex: 1, display: "flex" }}>
          {rightTabs.map((tab) => (
            <Tab key={tab.id} {...tab} t={t} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function Tab({ to, icon: Icon, id, t }) {
  return (
    <NavLink to={to} style={{ flex: 1 }}>
      {({ isActive }) => (
        <div style={item}>
          <div style={{ position: "relative", width: 46, height: 30, display: "grid", placeItems: "center" }}>
            {isActive && (
              <motion.span
                layoutId="bnav-pill"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                style={pill}
              />
            )}
            <motion.span
              animate={{ scale: isActive ? 1 : 0.94, y: isActive ? 0 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              style={{ position: "relative", display: "inline-flex" }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} color={isActive ? "var(--indigo-600)" : "var(--text-tertiary)"} />
            </motion.span>
          </div>
          <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, whiteSpace: "nowrap", color: isActive ? "var(--indigo-600)" : "var(--text-tertiary)" }}>{t(`nav.${id}`)}</span>
        </div>
      )}
    </NavLink>
  );
}

const item = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 3 };
const pill = { position: "absolute", inset: 0, borderRadius: 13, background: "var(--indigo-50)", border: "1px solid var(--indigo-100)" };
const fabWrap = { width: 68, flexShrink: 0, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" };
const fabCircle = {
  position: "absolute", top: -16, width: 50, height: 50, borderRadius: "50%",
  background: "linear-gradient(180deg, var(--crimson-mid), var(--crimson))",
  border: "3px solid var(--bg-card)", display: "grid", placeItems: "center",
  boxShadow: "0 6px 20px -4px rgba(156,28,20,.55)",
};
const fabLabel = {
  position: "absolute", bottom: 5, left: 0, right: 0, textAlign: "center",
  fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)",
};
