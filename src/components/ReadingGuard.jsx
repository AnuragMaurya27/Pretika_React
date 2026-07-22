import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";

/**
 * Best-effort reading protection for the story reader.
 *
 * IMPORTANT: the web platform CANNOT truly block screenshots or OCR — no browser
 * API exists for it (only native apps have FLAG_SECURE). This is a *deterrent*:
 *   - disables text selection / copy / right-click / drag on the story body,
 *   - blanks print, obscures the page only when the tab is genuinely hidden.
 *
 * The traceable per-reader WATERMARK is NOT rendered here — it is painted as a CSS
 * background on the reader itself (see `wmBg` in Reader.jsx). A positioned overlay
 * (fixed OR absolute) repaints on scroll and flickered badly on mobile; a plain
 * background scrolls with the text and never repaints separately.
 */
export default function ReadingGuard() {
  const { t } = useTranslation();
  const [obscured, setObscured] = useState(false);

  useEffect(() => {
    // Only block copy/cut when the active selection is inside the story body —
    // comments, inputs, etc. keep working normally.
    const selInReader = () => {
      const sel = window.getSelection?.();
      const node = sel && sel.anchorNode;
      const el = node ? (node.nodeType === 1 ? node : node.parentElement) : null;
      return !!el?.closest?.(".reader-body");
    };
    const onCopyCut = (e) => { if (selInReader()) e.preventDefault(); };
    // Right-click / drag disabled anywhere in the reader shell.
    const onCtxDrag = (e) => { if (e.target?.closest?.(".rd-shell")) e.preventDefault(); };
    // Obscure ONLY when the tab is genuinely hidden (tab/app switch) — NOT on
    // window blur/focus, which fire on mobile ad-iframe focus & address-bar changes.
    const onVis = () => setObscured(document.hidden);

    document.addEventListener("copy", onCopyCut);
    document.addEventListener("cut", onCopyCut);
    document.addEventListener("contextmenu", onCtxDrag);
    document.addEventListener("dragstart", onCtxDrag);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("copy", onCopyCut);
      document.removeEventListener("cut", onCopyCut);
      document.removeEventListener("contextmenu", onCtxDrag);
      document.removeEventListener("dragstart", onCtxDrag);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <>
      {obscured && (
        <div className="rd-obscure" role="status" aria-live="polite">
          <div>
            <ShieldAlert size={40} strokeWidth={1.6} />
            <div className="rd-obscure-title">{t("reader.guard.pausedTitle")}</div>
            <div className="rd-obscure-sub">{t("reader.guard.pausedSub")}</div>
          </div>
        </div>
      )}
      {/* Print → blank sheet with a protection notice (see @media print in index.css) */}
      <div className="rd-print-block">{t("reader.guard.printBlocked")}</div>
    </>
  );
}
