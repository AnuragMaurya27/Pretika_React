import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Flag, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useCreateReport } from "../lib/hooks";
import { errMsg } from "../lib/api";

// Same reasons the API's CreateReportRequest accepts.
const REASONS = [
  "inappropriate",
  "spam",
  "hate_speech",
  "adult_content",
  "copyright",
  "misinformation",
  "other",
];

/**
 * Report bottom-sheet (portal to <body> — the Layout page-transition filter
 * traps position:fixed, so never render this inline). Works for any entity
 * the API supports; today the app uses it for stories.
 */
export default function ReportSheet({ open, onClose, entityType = "story", entityId }) {
  return createPortal(
    <AnimatePresence>
      {open && <SheetInner onClose={onClose} entityType={entityType} entityId={entityId} />}
    </AnimatePresence>,
    document.body
  );
}

// Inner mounts only while open, so the form state resets naturally each time.
function SheetInner({ onClose, entityType, entityId }) {
  const { t } = useTranslation();
  const report = useCreateReport();
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    if (!reason || report.isPending) return;
    report.mutate(
      { entity_type: entityType, entity_id: entityId, reason, description: details.trim() || undefined },
      {
        onSuccess: () => { toast.success(t("report.thanks")); onClose?.(); },
        onError: (e) => toast.error(errMsg(e)),
      }
    );
  };

  return (
    <>
      <motion.div
        className="fls-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
          <div className="fls-wrap" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
            <motion.div
              className="fls-sheet"
              role="dialog" aria-modal="true" aria-label={t("report.title")}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <div className="fls-grip" aria-hidden />

              <div className="between fls-head">
                <span className="row gap-8" style={{ fontWeight: 800, fontSize: 18 }}>
                  <Flag size={18} color="var(--indigo-600)" /> {t("report.title")}
                </span>
                <button onClick={onClose} className="fls-close" aria-label={t("common.close")}>
                  <X size={19} />
                </button>
              </div>

              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
                {t("report.sub")}
              </p>

              <div style={{ overflowY: "auto", minHeight: 0 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  {REASONS.map((r) => {
                    const on = reason === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setReason(r)}
                        className="row between"
                        style={{
                          width: "100%", textAlign: "left", padding: "12px 14px",
                          borderRadius: 12, fontSize: 14, fontWeight: 600,
                          background: on ? "var(--indigo-50)" : "var(--bg-secondary)",
                          border: `1.5px solid ${on ? "var(--indigo-600)" : "transparent"}`,
                          color: on ? "var(--indigo-800)" : "var(--text-primary)",
                          transition: "background .15s ease, border-color .15s ease",
                        }}
                      >
                        {t(`report.reasons.${r}`)}
                        {on && <Check size={16} color="var(--indigo-600)" />}
                      </button>
                    );
                  })}
                </div>

                <div className="field" style={{ marginTop: 14 }}>
                  <label className="field-label">{t("report.detailsLabel")}</label>
                  <textarea
                    className="input"
                    style={{ height: 84, paddingTop: 12, resize: "none" }}
                    maxLength={500}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={t("report.detailsPh")}
                  />
                </div>
              </div>

              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 4 }}
                disabled={!reason || report.isPending}
                onClick={submit}
              >
                {report.isPending ? "…" : t("report.submit")}
              </button>
            </motion.div>
          </div>
    </>
  );
}
