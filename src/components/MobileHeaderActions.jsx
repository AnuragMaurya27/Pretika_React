import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../store/auth";
import LangToggle from "./LangToggle";
import NotificationBell from "./NotificationBell";
import Img from "./Img";

// The mobile top-right cluster. Logged in → notification bell + profile avatar
// (profile moved up here from the bottom tab bar). Logged out → Log in / Sign up.
// `dark` styles it for the charcoal headers (Home, Feed); omit on light headers.
export default function MobileHeaderActions({ dark = false }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const avatarBorder = dark ? "rgba(255,255,255,.32)" : "var(--border-dark)";

  return (
    <div className="row gap-8">
      <LangToggle dark={dark} />
      {user ? (
        <>
          <NotificationBell dark={dark} />
          <Link to="/profile" aria-label={t("nav.profile")} style={{ display: "inline-flex", flexShrink: 0 }}>
            <Img
              path={user.avatar_url}
              seed={user.username}
              kind="avatar"
              alt={t("nav.profile")}
              style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: `2px solid ${avatarBorder}` }}
            />
          </Link>
        </>
      ) : (
        // Just a single Log in button, same as the desktop nav.
        <Link to="/login" className="btn btn-sm" style={dark ? loginDark : loginLight}>{t("auth.login")}</Link>
      )}
    </div>
  );
}

const loginDark = { background: "#fff", color: "var(--indigo-900)", fontWeight: 700, whiteSpace: "nowrap" };
const loginLight = { background: "var(--indigo-600)", color: "#fff", fontWeight: 700, whiteSpace: "nowrap" };
