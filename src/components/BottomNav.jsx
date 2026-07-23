import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, User, Plus, MessageCircle, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

// Mobile tab bar — Home · Explore · [Write FAB] · Chats · Profile.
// Two tabs flank the Write FAB on each side so it always sits dead-center
// of the bar (an odd 5-slot grid); never let it drift off to one side.
const leftTabs = [
  { to: "/home", icon: Home, id: "home" },
  { to: "/explore", icon: Search, id: "explore" },
];
const rightTabs = [
  { to: "/chat", icon: MessageCircle, id: "messages" },
  { to: "/profile", icon: User, id: "profile" },
];

export default function BottomNav() {
  const { t } = useTranslation();
  const nav = useNavigate();
  return (
    <nav className="only-mobile bnav">
      <div style={{ display: "flex", height: 58 }}>
        {leftTabs.map((tab) => (
          <Tab key={tab.id} {...tab} t={t} />
        ))}

        {/* Write FAB — the center create-story button. It's the middle slot of
            a symmetric 5-column row (2 tabs · FAB · 2 tabs), so its circle
            always lands at the exact horizontal center of the bar. The circle
            floats above the bar and the label is pinned to the bar's bottom
            edge so it can never slip under the safe-area / get clipped. */}
        <button onClick={() => nav("/creator/story/new")} style={fabWrap} aria-label={t("nav.write")}>
          <motion.div whileTap={{ scale: 0.88 }} className="pulse-glow" style={fabCircle}>
            <Plus size={22} color="#fff" />
          </motion.div>
          <span style={fabLabel}>{t("nav.write")}</span>
        </button>

        {rightTabs.map((tab) => (
          <Tab key={tab.id} {...tab} t={t} />
        ))}
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
const fabWrap = { flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" };
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
