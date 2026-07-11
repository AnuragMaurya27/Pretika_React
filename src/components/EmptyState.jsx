import { motion } from "framer-motion";
import { Skull } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Spook } from "./Art";

// Cross-platform empty states — vector art only (no emoji). Pass a lucide
// `icon` node for a themed crest, or `art` for a custom illustration; defaults
// to the ghost (Spook).
export default function EmptyState({ icon, art, title, sub, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: "center", padding: "56px 28px" }}
    >
      <div className="pk-float" style={{ display: "grid", placeItems: "center" }}>
        {art ?? (icon
          ? <div style={iconCircle}>{icon}</div>
          : <Spook size={76} tone="light" />)}
      </div>
      {title && <div className="serif" style={{ fontWeight: 800, fontSize: 18, marginTop: 14 }}>{title}</div>}
      {sub && <div className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.6 }}>{sub}</div>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </motion.div>
  );
}

const iconCircle = {
  width: 84, height: 84, borderRadius: "50%", display: "grid", placeItems: "center",
  background: "var(--indigo-50)", color: "var(--crimson)", border: "1px solid var(--indigo-100)",
};

export function ErrorState({ onRetry, message }) {
  const { t } = useTranslation();
  return (
    <div style={{ textAlign: "center", padding: "48px 28px" }}>
      <div style={{ display: "grid", placeItems: "center", color: "var(--text-tertiary)" }}><Skull size={42} /></div>
      <div className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>{message || t("common.somethingWrong")}</div>
      {onRetry && (
        <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={onRetry}>
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
