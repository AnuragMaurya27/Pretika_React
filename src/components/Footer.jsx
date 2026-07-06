import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EyeLogo } from "./Art";
import { useAuth } from "../store/auth";

/* Desktop site footer — internal links (SEO) + brand atmosphere.
   Hidden on phones (the bottom tab bar covers navigation there). */
export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const authed = useAuth((s) => s.isAuthed)();
  const isCreator = useAuth((s) => s.user?.is_creator);

  // Account column adapts to auth state — no Login/Sign-up once signed in.
  const accountLinks = authed
    ? [
        { to: "/home", label: t("nav.home") },
        { to: "/creator/story/new", label: t("nav.write") },
        {
          to: isCreator ? "/creator-dashboard" : "/become-creator",
          label: isCreator ? t("creator.dashboard") : t("profile.becomeCreator"),
        },
        { to: "/profile", label: t("nav.profile") },
      ]
    : [
        { to: "/home", label: t("nav.home") },
        { to: "/creator/story/new", label: t("nav.write") },
        { to: "/login", label: t("auth.login") },
        { to: "/register", label: t("auth.register") },
      ];
  return (
    <footer className="only-desktop" style={wrap}>
      <div className="fog" style={{ opacity: 0.25 }} />
      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div style={grid}>
          {/* Brand */}
          <div style={{ maxWidth: 320 }}>
            <div className="row gap-10" style={{ marginBottom: 12 }}>
              <EyeLogo size={34} />
              <span className="serif" style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>Pretika</span>
            </div>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13.5, lineHeight: 1.7 }}>
              Spine-chilling Hindi horror stories — read, write, and feel the fear that follows you home.
            </p>
          </div>

          <FooterCol title={t("nav.explore")} links={[
            { to: "/explore?sort=trending", label: t("home.trending") },
            { to: "/explore?sort=latest", label: t("home.newStories") },
            { to: "/explore?sort=top_rated", label: "Top rated" },
            { to: "/explore", label: t("home.all") },
          ]} />

          <FooterCol title="Pretika" links={accountLinks} />

          <FooterCol title="Company" links={[
            { to: "/about", label: "About us" },
            { to: "/contact", label: "Contact" },
            { to: "/privacy", label: "Privacy Policy" },
            { to: "/terms", label: "Terms of Use" },
          ]} />
        </div>

        <div style={hr} />
        <div className="between" style={{ flexWrap: "wrap", gap: 10, color: "rgba(255,255,255,.45)", fontSize: 12.5 }}>
          <span>© {year} Pretika · Hindi Horror Stories</span>
          <span>Read · Write · Feel the fear</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="eyebrow" style={{ color: "var(--indigo-200)", marginBottom: 14 }}>{title}</div>
      <ul style={{ display: "grid", gap: 10 }}>
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link to={l.to} style={linkStyle}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const wrap = {
  position: "relative", overflow: "hidden", marginTop: 40,
  background: "linear-gradient(180deg, #1c0c0a 0%, #120706 100%)",
  borderTop: "1px solid rgba(196,50,39,.25)",
  padding: "48px 0 32px",
};
const grid = {
  display: "grid", gap: 40,
  gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
  alignItems: "start",
};
const hr = { height: 1, background: "rgba(255,255,255,.1)", margin: "32px 0 18px" };
const linkStyle = { color: "rgba(255,255,255,.62)", fontSize: 13.5, transition: "color .15s" };
