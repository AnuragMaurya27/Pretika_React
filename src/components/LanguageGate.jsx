import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLang } from "../store/lang";
import { useAuth } from "../store/auth";
import { STORAGE } from "../lib/constants";
import { EyeLogo } from "./Art";

/**
 * First-visit language picker. Shows once per device — any selection (here,
 * from the navbar, or restored from a logged-in account's preferred_language)
 * sets the "chosen" flag and the popup never returns, even across logout/login.
 * Portalled to <body> so no page-transition wrapper can trap it.
 */
export default function LanguageGate() {
  const chosen = useLang((s) => s.chosen);
  const setLang = useLang((s) => s.setLang);
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const hasToken = !!localStorage.getItem(STORAGE.token);

  // Existing account with a saved language → adopt it silently, no popup.
  useEffect(() => {
    if (!chosen && user?.preferred_language) {
      setLang(user.preferred_language, { sync: false });
    }
  }, [chosen, user, setLang]);

  if (chosen) return null;
  // Logged-in device still hydrating — wait instead of flashing the popup.
  if (hasToken && (!ready || user?.preferred_language)) return null;

  return createPortal(
    <div style={overlay} role="dialog" aria-modal="true" aria-label="Choose your language / अपनी भाषा चुनें">
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={card}
      >
        <div style={{ display: "grid", placeItems: "center" }}><EyeLogo size={44} /></div>
        <h2 className="serif" style={{ fontSize: 22, fontWeight: 800, marginTop: 12, textAlign: "center" }}>
          अपनी भाषा चुनें
        </h2>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 4, textAlign: "center" }}>
          Choose your language
        </p>

        <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
          <LangOption
            title="हिन्दी"
            sub="पूरी वेबसाइट हिन्दी में"
            sample="डर यहाँ कहानी बन जाता है…"
            onPick={() => setLang("hindi")}
          />
          <LangOption
            title="English"
            sub="The whole website in English"
            sample="Where fear becomes a story…"
            onPick={() => setLang("english")}
          />
        </div>

        <p className="tertiary" style={{ fontSize: 11.5, marginTop: 16, textAlign: "center", lineHeight: 1.6 }}>
          आप इसे कभी भी बदल सकते हैं · You can change this anytime
        </p>
      </motion.div>
    </div>,
    document.body
  );
}

function LangOption({ title, sub, sample, onPick }) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onPick}
      style={option}
    >
      <span style={{ flex: 1, textAlign: "left" }}>
        <span className="serif" style={{ display: "block", fontSize: 19, fontWeight: 800 }}>{title}</span>
        <span className="muted" style={{ display: "block", fontSize: 12.5, marginTop: 2 }}>{sub}</span>
        <span style={{ display: "block", fontSize: 11.5, marginTop: 6, color: "var(--crimson)", fontStyle: "italic" }}>{sample}</span>
      </span>
      <span style={pickIc}><Check size={16} /></span>
    </motion.button>
  );
}

const overlay = {
  position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center",
  padding: 20, background: "rgba(20,6,5,.6)",
  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
};
const card = {
  width: "100%", maxWidth: 400, background: "var(--bg-card, #fff)",
  border: "1px solid var(--border-solid)", borderRadius: 22, padding: "26px 22px 20px",
  boxShadow: "0 30px 80px rgba(20,6,5,.5)",
};
const option = {
  display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px",
  background: "var(--bg, #faf6ee)", border: "1.5px solid var(--border-dark)",
  borderRadius: 16, cursor: "pointer", transition: "border-color .15s",
};
const pickIc = {
  width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center",
  background: "var(--indigo-50)", color: "var(--crimson)", border: "1px solid var(--indigo-100)",
  flexShrink: 0,
};
