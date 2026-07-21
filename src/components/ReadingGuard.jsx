import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../store/auth";

/**
 * Best-effort reading protection for the story reader.
 *
 * IMPORTANT: the web platform CANNOT truly block screenshots or OCR — no browser
 * API exists for it (only native apps have FLAG_SECURE). This component is a
 * *deterrent*, not a guarantee. It:
 *   - disables text selection / copy / right-click / drag on the story body,
 *   - obscures the page when the tab/window loses focus (deters OCR-app swaps &
 *     screen-share), and — most usefully —
 *   - stamps every page with a faint, tiled watermark of the reader's identity,
 *     so any leaked screenshot is traceable back to the account.
 */
export default function ReadingGuard({ theme = "parchment" }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
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
    // Obscure ONLY when the tab is genuinely hidden (tab/app switch). We deliberately
    // do NOT hook window blur/focus — on mobile those fire on ad-iframe focus and
    // address-bar show/hide during scrolling, which caused the reader to flicker.
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

  // Diagonal, tiled watermark carrying the reader's identity → traceable leaks.
  const tag = user?.username ? `@${user.username}` : "pretika.in";
  const idShort = user?.id ? String(user.id).slice(0, 8) : "guest";
  const stamp = new Date().toISOString().slice(0, 10);
  const label = `${tag} · ${idShort} · ${stamp}`.replace(/[<>&]/g, "");
  const fill = theme === "midnight" ? "rgba(255,255,255,0.07)" : "rgba(20,4,4,0.06)";
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='188'>` +
    `<text x='12' y='96' transform='rotate(-28 160 96)' fill='${fill}' ` +
    `font-family='system-ui,-apple-system,sans-serif' font-size='13' font-weight='600'>` +
    `${label}</text></svg>`;
  const bg = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

  return (
    <>
      <div className="rd-watermark" aria-hidden="true" style={{ backgroundImage: bg }} />
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
