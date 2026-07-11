import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, PenSquare, Users, TrendingUp, Award, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { post, errMsg } from "../lib/api";
import { useAuth } from "../store/auth";
import Seo from "../components/Seo";

export default function BecomeCreator() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const fetchMe = useAuth((s) => s.fetchMe);
  const promoteToCreator = useAuth((s) => s.promoteToCreator);
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      await post("/users/me/become-creator");
      promoteToCreator();          // flip UI immediately (survives a failed refetch)
      fetchMe().catch(() => {});   // reconcile fuller profile in the background
      toast.success(t("creator.becomeTitle"));
      nav("/creator-dashboard");
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const perks = [
    { icon: <PenSquare size={18} />, text: t("creator.becomeSub") },
    { icon: <Users size={18} />, text: "Build an audience of readers who follow your every episode" },
    { icon: <TrendingUp size={18} />, text: "Analytics, milestones & creator Fear Rank" },
    { icon: <Award size={18} />, text: "Climb from Pret Aatma to Mahakaal Katha Samrat" },
  ];

  return (
    <div className="app-shell" style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <Seo title="Become a Creator" robots="noindex, follow" />
      <header className="container row gap-12" style={{ height: 56 }}>
        <button onClick={() => nav(-1)}><ArrowLeft size={22} /></button>
        <div className="section-title">{t("creator.becomeTitle")}</div>
      </header>

      <div className="container" style={{ paddingTop: 12, paddingBottom: 40, maxWidth: 560 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ borderRadius: 18, padding: 28, color: "#fff", textAlign: "center", background: "linear-gradient(135deg,var(--indigo-900),var(--indigo-600))", position: "relative", overflow: "hidden" }}>
          <div className="fog" />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "grid", placeItems: "center" }}><PenSquare size={46} color="#fff" /></div>
            <div className="display" style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>{t("creator.becomeTitle")}</div>
            <p style={{ opacity: .9, fontSize: 14, marginTop: 6 }}>{t("creator.becomeSub")}</p>
          </div>
        </motion.div>

        <div className="card" style={{ padding: 8, marginTop: 16 }}>
          {perks.map((p, i) => (
            <div key={i} className="row gap-12" style={{ padding: "12px 12px", borderBottom: i < perks.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--indigo-50)", color: "var(--indigo-600)", display: "grid", placeItems: "center", flexShrink: 0 }}>{p.icon}</div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.text}</div>
              <div style={{ flex: 1 }} /><Check size={18} color="var(--green)" />
            </div>
          ))}
        </div>

        {user?.is_creator ? (
          <button className="btn btn-primary btn-block mt-24" onClick={() => nav("/creator-dashboard")}>{t("creator.dashboard")}</button>
        ) : (
          <button className="btn btn-primary btn-block mt-24 pulse-glow" disabled={busy} onClick={go}>
            {busy ? t("common.loading") : t("creator.becomeTitle")}
          </button>
        )}
      </div>
    </div>
  );
}
