import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Check, Loader2, ImagePlus, ImageOff, Smartphone, Monitor,
  Crop, CheckCircle2, Scissors,
} from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Upload preview — shows the picked avatar / cover EXACTLY as the app will
 * frame it (object-fit: cover) *before* anything reaches the API, plus a
 * "whole image" view that dims whatever gets cropped away.
 *
 * Covers get framed twice: `.pf-cover` is full-bleed, so a phone crops the
 * sides while a wide desktop crops the top and bottom — the same file looks
 * very different on the two, and the user should see both before uploading.
 */

// mirrors `.pf-cover` in index.css — 168px tall on phones, 224px on desktop
const PHONE_COVER = 390 / 168;    // ≈ 2.32
const DESKTOP_COVER = 1440 / 224; // ≈ 6.43

/** Fraction of the image that survives an object-fit:cover into `aspect`. */
function kept(ratio, aspect) {
  if (!ratio || !aspect) return { w: 1, h: 1, cut: 0 };
  if (ratio > aspect) { const w = aspect / ratio; return { w, h: 1, cut: 1 - w }; }
  const h = ratio / aspect;
  return { w: 1, h, cut: 1 - h };
}

const pct = (n) => `${(n * 100).toFixed(2)}%`;

export default function ImageUploadPreview({
  open, kind = "avatar", file, busy, onCancel, onPickAnother, onConfirm,
}) {
  const { t } = useTranslation();
  // The blob URL and the natural size arrive together and are tagged with the
  // file they belong to — a fresh pick then resets everything (back to
  // "measuring", back to the frame tab) without a setState-in-effect cascade.
  const [loaded, setLoaded] = useState(null); // { file, url, w, h }
  const [view, setView] = useState({ file: null, mode: "frame" });
  const shot = loaded?.file === file ? loaded : null;
  const url = shot?.url || null;
  const mode = view.file === file ? view.mode : "frame"; // frame | full
  const setMode = (m) => setView({ file, mode: m });

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => setLoaded({ file, url: u, w: probe.naturalWidth, h: probe.naturalHeight });
    probe.onerror = () => setLoaded({ file, url: u, w: 0, h: 0 }); // unreadable → say so
    probe.src = u;
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Esc closes — but never mid-upload
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape" && !busy) onCancel?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  const isCover = kind === "cover";
  const readable = !!shot && shot.w > 0 && shot.h > 0;
  const ratio = readable ? shot.w / shot.h : 0;
  const phone = kept(ratio, PHONE_COVER);
  const desktop = kept(ratio, DESKTOP_COVER);
  const square = kept(ratio, 1);
  // a circular avatar also loses the square's corners, but the honest number
  // users care about is how much of their photo falls outside the frame
  const cut = isCover ? Math.max(phone.cut, desktop.cut) : square.cut;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="ts-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={busy ? undefined : onCancel}
          />
          <motion.div
            className="ipv-panel"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            role="dialog" aria-modal="true"
          >
            <div className="ipv-head">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>
                  {t(isCover ? "preview.titleCover" : "preview.titleAvatar")}
                </div>
                <div className="tertiary" style={{ fontSize: 11.5 }}>{t("preview.sub")}</div>
              </div>
              <button onClick={onCancel} disabled={busy} aria-label={t("common.cancel")}
                className="rd-iconbtn" style={{ color: "var(--text-secondary)" }}>
                <X size={20} />
              </button>
            </div>

            <div className="ipv-body">
              {readable && (
                <div className="ipv-seg">
                  <button className={mode === "frame" ? "on" : ""} onClick={() => setMode("frame")}>
                    <Crop size={14} /> {t("preview.tabFrame")}
                  </button>
                  <button className={mode === "full" ? "on" : ""} onClick={() => setMode("full")}>
                    <ImagePlus size={14} /> {t("preview.tabFull")}
                  </button>
                </div>
              )}

              {!readable ? (
                <div className="ipv-loading tertiary">
                  {shot
                    ? <><ImageOff size={18} /> {t("preview.failed")}</>
                    : <><Loader2 size={20} className="spin" /> {t("preview.loading")}</>}
                </div>
              ) : mode === "frame" ? (
                <div className="ipv-stage">
                  {isCover ? (
                    <>
                      <CoverShot url={url} aspect={PHONE_COVER} icon={<Smartphone size={13} />} label={t("preview.onPhone")} />
                      <CoverShot url={url} aspect={DESKTOP_COVER} icon={<Monitor size={13} />} label={t("preview.onDesktop")} />
                    </>
                  ) : (
                    <>
                      <div className="ipv-ring"><img src={url} alt="" /></div>
                      <div className="ipv-mini-row">
                        <span className="ipv-mini" style={{ width: 44, height: 44 }}><img src={url} alt="" /></span>
                        <span className="ipv-mini" style={{ width: 28, height: 28 }}><img src={url} alt="" /></span>
                        <span className="tertiary" style={{ fontSize: 11.5 }}>{t("preview.smallSizes")}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="ipv-stage">
                  <div className="ipv-full-wrap">
                    <div className="ipv-full">
                      <img src={url} alt="" />
                      {isCover ? (
                        <>
                          <span className="ipv-mask" style={{ width: pct(phone.w), height: pct(phone.h) }} />
                          <span className="ipv-ghost" style={{ width: pct(desktop.w), height: pct(desktop.h) }} />
                        </>
                      ) : (
                        <span className="ipv-mask round" style={{ width: pct(square.w), height: pct(square.h) }} />
                      )}
                    </div>
                  </div>
                  {isCover && (
                    <div className="ipv-legend tertiary">
                      <span className="row gap-6"><i className="ipv-key" /> {t("preview.legendPhone")}</span>
                      <span className="row gap-6"><i className="ipv-key dash" /> {t("preview.legendDesktop")}</span>
                    </div>
                  )}
                </div>
              )}

              {readable && (
                <div className={`ipv-note ${cut < 0.02 ? "ok" : "warn"}`}>
                  {cut < 0.02 ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <Scissors size={16} style={{ flexShrink: 0 }} />}
                  <span>
                    {cut < 0.02
                      ? t(isCover ? "preview.noCrop" : "preview.noCropAvatar")
                      : <>{t("preview.cropped", { p: Math.round(cut * 100) })} {t(isCover ? "preview.tipCover" : "preview.tipAvatar")}</>}
                  </span>
                </div>
              )}
            </div>

            <div className="ipv-foot">
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onPickAnother} disabled={busy}>
                <ImagePlus size={16} /> {t("preview.change")}
              </button>
              <button className="btn btn-primary" style={{ flex: 1.4 }} onClick={onConfirm} disabled={busy || !url}>
                {busy
                  ? <><Loader2 size={16} className="spin" /> {t("preview.uploading")}</>
                  : <><Check size={16} /> {t("preview.upload")}</>}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** One full-bleed cover framing (phone or desktop), with the real page shade. */
function CoverShot({ url, aspect, icon, label }) {
  return (
    <div>
      <div className="ipv-cap">{icon} {label}</div>
      <div className="ipv-frame" style={{ aspectRatio: aspect }}>
        <img src={url} alt="" />
        <div className="pf-cover-shade" />
      </div>
    </div>
  );
}
