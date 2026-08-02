import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

/**
 * Full-screen image viewer for chat photos.
 *  - tap the backdrop or ✕ to close, Esc closes on desktop
 *  - double-tap / double-click toggles a 2× zoom, then drag to pan
 *  - Save downloads the image (same-origin/CORS hosts save straight to the
 *    device; a cross-origin host without CORS falls back to opening the file
 *    full-size so the user can long-press → save).
 */
export default function ImageLightbox({ src, filename, onClose }) {
  const { t } = useTranslation();
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleZoom = () => {
    setZoomed((z) => !z);
    setPan({ x: 0, y: 0 });
  };

  const onPointerDown = (e) => {
    if (!zoomed) return;
    drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onPointerMove = (e) => {
    if (!zoomed || !drag.current) return;
    setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
  };
  const onPointerUp = () => { drag.current = null; };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(src, { mode: "cors" });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `pretika-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("chat.saved"));
    } catch {
      // cross-origin without CORS headers → open full-size for a manual save
      window.open(src, "_blank", "noopener,noreferrer");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="lightbox-bar" onClick={(e) => e.stopPropagation()}>
          <button className="lightbox-btn" onClick={save} aria-label={t("chat.saveImage")} disabled={saving}>
            {saving ? <Loader2 size={20} className="spin" /> : <Download size={20} />}
          </button>
          <button className="lightbox-btn" onClick={onClose} aria-label={t("common.close")}>
            <X size={22} />
          </button>
        </div>
        <motion.img
          key={src}
          src={src}
          alt=""
          className="lightbox-img"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={toggleZoom}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomed ? 2 : 1})`,
            cursor: zoomed ? "grab" : "zoom-in",
            touchAction: zoomed ? "none" : "auto",
          }}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: zoomed ? 2 : 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        />
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
