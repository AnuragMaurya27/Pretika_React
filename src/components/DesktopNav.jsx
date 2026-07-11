import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, User, PenSquare, LogOut, ChevronDown, BadgeCheck, MessageSquareText } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAuth } from "../store/auth";
import Img from "./Img";
import LangToggle from "./LangToggle";
import { EyeLogo } from "./Art";

const links = [
  { to: "/home", icon: Home, key: "home" },
  { to: "/explore", icon: Search, key: "explore" },
  { to: "/chat-stories", icon: MessageSquareText, key: "chat" },
];

// Top navigation bar — shown on tablet/laptop/TV (md+). Hidden on phones.
export default function DesktopNav() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  const doLogout = async () => {
    setMenuOpen(false);
    await logout();
    toast.success(t("toast.bye"));
    nav("/login");
  };

  return (
    <header className="only-desktop" style={bar}>
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 18, height: 64 }}>
        <Link to="/home" className="row gap-10">
          <EyeLogo size={34} />
          <span className="display" style={{ fontSize: 23, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>Pretika</span>
        </Link>

        <nav style={{ display: "flex", gap: 4, marginLeft: 10 }}>
          {links.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <span style={{ ...navItem, position: "relative", color: isActive ? "#fff" : "rgba(255,255,255,.7)" }}>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      style={navPill}
                    />
                  )}
                  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <Icon size={18} /> {t(`nav.${key}`)}
                  </span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <LangToggle dark />
        <button onClick={() => nav("/creator/story/new")} style={writeBtn}>
          <PenSquare size={16} /> {t("nav.write")}
        </button>
        {user ? (
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button onClick={() => setMenuOpen((o) => !o)} style={avatarBtn} aria-label={t("nav.profile")}>
              <Img path={user.avatar_url} seed={user.username} kind="avatar" alt=""
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,.25)" }} />
              <ChevronDown size={16} color="rgba(255,255,255,.75)"
                style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  style={menuWrap}
                >
                  <div style={menuCard}>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "8px 12px 10px", borderBottom: "1px solid var(--border-solid)", marginBottom: 6 }}>
                      <div className="row gap-4" style={{ fontWeight: 700, fontSize: 14 }}>
                        <span className="clamp-1">{user.display_name || user.username}</span>
                        {user.is_verified_creator && <BadgeCheck size={14} color="var(--blue)" />}
                      </div>
                      <div className="tertiary" style={{ fontSize: 12 }}>@{user.username}</div>
                    </Link>
                    <Link to="/profile" className="nav-menu-item" onClick={() => setMenuOpen(false)}>
                      <User size={17} /> {t("nav.profile")}
                    </Link>
                    <button className="nav-menu-item danger" onClick={doLogout}>
                      <LogOut size={17} /> {t("auth.logout")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link to="/login" className="btn btn-sm" style={{ background: "#fff", color: "var(--indigo-900)" }}>{t("auth.login")}</Link>
        )}
      </div>
    </header>
  );
}

const bar = {
  position: "sticky", top: 0, zIndex: 40,
  background: "linear-gradient(180deg, rgba(35,9,6,.9), rgba(20,6,5,.82))",
  backdropFilter: "saturate(180%) blur(18px)",
  WebkitBackdropFilter: "saturate(180%) blur(18px)",
  borderBottom: "1px solid rgba(196,50,39,.22)",
};
const navItem = { display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, fontSize: 14, fontWeight: 600, transition: "color .2s" };
const navPill = { position: "absolute", inset: 0, borderRadius: 10, background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.12)", zIndex: 0 };
const writeBtn = { display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px", borderRadius: 10, background: "var(--indigo-600)", color: "#fff", fontWeight: 600, fontSize: 14 };
const avatarBtn = { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px 3px 3px", borderRadius: 22, background: "rgba(255,255,255,.1)" };
const menuWrap = { position: "absolute", top: "100%", right: 0, paddingTop: 10, zIndex: 60 };
const menuCard = {
  minWidth: 214, background: "var(--bg-card)", color: "var(--text-primary)",
  border: "1px solid var(--border-solid)", borderRadius: 14, padding: 6,
  boxShadow: "0 14px 40px rgba(40,20,12,.22)",
};
