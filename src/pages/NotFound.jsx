import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Spook } from "../components/Art";
import Seo from "../components/Seo";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="app-shell scene-3d" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", position: "relative", overflow: "hidden", background: "radial-gradient(120% 90% at 50% 0%, #43100b 0%, #230906 60%, #140605 100%)", color: "#fff" }}>
      <Seo title="404 — Page Not Found" robots="noindex, follow" />
      <div className="aurora" style={{ opacity: 0.4 }} />
      <div className="fog" style={{ opacity: 0.4 }} />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.7 }}
        className="center container"
        style={{ position: "relative", zIndex: 2, maxWidth: 460 }}
      >
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ display: "grid", placeItems: "center", filter: "drop-shadow(0 10px 30px rgba(224,85,69,.45))" }}
        >
          <Spook size={96} tone="dark" />
        </motion.div>
        <div className="serif shine-text" style={{ fontSize: 30, fontWeight: 800, marginTop: 12 }}>{t("notfound.title")}</div>
        <p style={{ color: "rgba(255,255,255,.7)", marginTop: 10, lineHeight: 1.6 }}>
          {t("notfound.sub")}
        </p>
        <div className="row gap-10" style={{ justifyContent: "center", marginTop: 26, flexWrap: "wrap" }}>
          <Link to="/home" className="btn btn-primary"><Home size={17} /> {t("notfound.backHome")}</Link>
          <Link to="/explore" className="btn btn-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,.5)", background: "rgba(255,255,255,.06)" }}>
            <Search size={16} /> {t("notfound.searchStories")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
