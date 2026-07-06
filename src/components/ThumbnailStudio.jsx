import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, ImagePlus, ZoomIn, Type, Trash2, Loader2, Check,
  Droplets, Square, RectangleHorizontal, BookOpen, Move,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { api, unwrap, errMsg } from "../lib/api";

/**
 * Thumbnail Studio — Instagram-style fixed-frame editor locked to the same
 * 0.68 poster ratio as the Home story cards.
 *  - drag to reposition, wheel / pinch to zoom (the frame IS the crop)
 *  - multiple draggable text layers: font, size, colour, shadow / outline /
 *    backdrop plate (no letter-spacing anywhere — Devanagari-safe)
 *  - live card chrome overlay so creators see the exact Home look
 *  - composites everything on a canvas and uploads one JPEG
 */

const EXPORT_W = 680;
const EXPORT_H = 1000; // 680 / 1000 = 0.68 — StoryCard poster ratio

const FONTS = [
  { css: "Yatra One", label: "यात्रा", weight: 400 },
  { css: "Noto Serif Devanagari", label: "सेरिफ़", weight: 800 },
  { css: "Cinzel", label: "Cinzel", weight: 800 },
  { css: "DM Sans", label: "Sans", weight: 800 },
];
const COLORS = ["#ffffff", "#ffe9c2", "#ffd600", "#ff5a45", "#9c1c14", "#7db6ff", "#9effa5", "#111111"];

let layerSeq = 1;

function clampView(v, img) {
  if (!img) return v;
  const cover = Math.max(EXPORT_W / img.width, EXPORT_H / img.height);
  const s = cover * v.zoom;
  const maxX = Math.max(0, (img.width * s - EXPORT_W) / 2);
  const maxY = Math.max(0, (img.height * s - EXPORT_H) / 2);
  return { ...v, x: Math.min(maxX, Math.max(-maxX, v.x)), y: Math.min(maxY, Math.max(-maxY, v.y)) };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function layerFont(l) {
  const f = FONTS.find((f) => f.css === l.font) || FONTS[0];
  return `${f.weight} ${l.size}px "${l.font}", "Noto Serif Devanagari", serif`;
}

/** Draws image + text layers; fills `bboxes` (id → rect) for hit-testing. */
function drawScene(ctx, img, view, layers, selectedId, bboxes) {
  ctx.clearRect(0, 0, EXPORT_W, EXPORT_H);
  ctx.fillStyle = "#17110d";
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

  if (img) {
    const cover = Math.max(EXPORT_W / img.width, EXPORT_H / img.height);
    const s = cover * view.zoom;
    const iw = img.width * s;
    const ih = img.height * s;
    ctx.drawImage(img, (EXPORT_W - iw) / 2 + view.x, (EXPORT_H - ih) / 2 + view.y, iw, ih);
  }

  for (const l of layers) {
    if (!l.text.trim()) { if (bboxes) delete bboxes[l.id]; continue; }
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = layerFont(l);
    const lines = l.text.split("\n");
    const lh = l.size * 1.2;
    const totalH = lh * lines.length;
    const wMax = Math.max(...lines.map((t) => ctx.measureText(t).width), 10);

    if (bboxes) bboxes[l.id] = { x: l.x - wMax / 2 - 16, y: l.y - totalH / 2 - 12, w: wMax + 32, h: totalH + 24 };

    if (l.plate) {
      roundRect(ctx, l.x - wMax / 2 - 20, l.y - totalH / 2 - 14, wMax + 40, totalH + 28, 16);
      ctx.fillStyle = "rgba(10,4,3,.55)";
      ctx.fill();
    }
    lines.forEach((line, i) => {
      const ly = l.y - totalH / 2 + lh * (i + 0.5);
      if (l.shadow) {
        ctx.shadowColor = "rgba(0,0,0,.8)";
        ctx.shadowBlur = l.size * 0.24;
        ctx.shadowOffsetY = l.size * 0.05;
      }
      if (l.outline) {
        ctx.lineJoin = "round";
        ctx.lineWidth = Math.max(2, l.size * 0.09);
        ctx.strokeStyle = "rgba(0,0,0,.85)";
        ctx.strokeText(line, l.x, ly);
      }
      ctx.fillStyle = l.color;
      ctx.fillText(line, l.x, ly);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    });

    if (selectedId === l.id) {
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,.9)";
      const b = bboxes?.[l.id];
      if (b) { roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
}

export default function ThumbnailStudio({ open, onClose, onDone, suggestedText = "" }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const bboxes = useRef({});
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  const [img, setImg] = useState(null);
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(() => layers.find((l) => l.id === selectedId) || null, [layers, selectedId]);

  // preload the poster fonts once so canvas text renders with the right faces
  useEffect(() => {
    if (!open || !document.fonts?.load) return;
    FONTS.forEach((f) => { document.fonts.load(`${f.weight} 40px "${f.css}"`).catch(() => {}); });
  }, [open]);

  // repaint on every state change (fonts may land late → repaint on fonts.ready too)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !open) return;
    drawScene(ctx, img, view, layers, selectedId, bboxes.current);
    document.fonts?.ready?.then(() => {
      const c = canvasRef.current?.getContext("2d");
      if (c) drawScene(c, img, view, layers, selectedId, bboxes.current);
    });
  }, [img, view, layers, selectedId, open]);

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return toast.error("Max 8MB image");
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setView({ zoom: 1, x: 0, y: 0 });
    };
    image.onerror = () => toast.error(t("common.somethingWrong"));
    image.src = url;
  };

  const updateLayer = (id, patch) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const addLayer = () => {
    const id = `t${layerSeq++}`;
    setLayers((ls) => [...ls, {
      id,
      text: suggestedText || "",
      font: "Yatra One",
      size: 74,
      color: "#ffffff",
      x: EXPORT_W / 2,
      y: EXPORT_H * (0.34 + ls.length * 0.14),
      shadow: true,
      outline: false,
      plate: false,
    }]);
    setSelectedId(id);
  };

  const removeLayer = (id) => {
    setLayers((ls) => ls.filter((l) => l.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    delete bboxes.current[id];
  };

  /* ── pointer interactions: drag text / pan image / pinch zoom ─────────── */
  const toCanvas = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * EXPORT_W,
      y: ((e.clientY - rect.top) / rect.height) * EXPORT_H,
    };
  };

  const onPointerDown = (e) => {
    canvasRef.current.setPointerCapture?.(e.pointerId);
    const p = toCanvas(e);
    pointers.current.set(e.pointerId, p);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { type: "pinch", d0: Math.hypot(a.x - b.x, a.y - b.y), zoom0: view.zoom };
      return;
    }
    // topmost text layer first
    const hit = [...layers].reverse().find((l) => {
      const bb = bboxes.current[l.id];
      return bb && p.x >= bb.x && p.x <= bb.x + bb.w && p.y >= bb.y && p.y <= bb.y + bb.h;
    });
    if (hit) {
      setSelectedId(hit.id);
      gesture.current = { type: "text", id: hit.id, start: p, orig: { x: hit.x, y: hit.y } };
    } else {
      gesture.current = { type: "image", start: p, orig: { x: view.x, y: view.y } };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = toCanvas(e);
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (!g) return;

    if (g.type === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const zoom = Math.min(4, Math.max(1, g.zoom0 * (d / g.d0)));
      setView((v) => clampView({ ...v, zoom }, img));
    } else if (g.type === "text") {
      const pad = 30;
      updateLayer(g.id, {
        x: Math.min(EXPORT_W - pad, Math.max(pad, g.orig.x + (p.x - g.start.x))),
        y: Math.min(EXPORT_H - pad, Math.max(pad, g.orig.y + (p.y - g.start.y))),
      });
    } else if (g.type === "image" && img) {
      setView((v) => clampView({ ...v, x: g.orig.x + (p.x - g.start.x), y: g.orig.y + (p.y - g.start.y) }, img));
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
  };

  const onWheel = (e) => {
    if (!img) return;
    e.preventDefault();
    const zoom = Math.min(4, Math.max(1, view.zoom * (1 - e.deltaY * 0.0012)));
    setView((v) => clampView({ ...v, zoom }, img));
  };

  /* ── export + upload ──────────────────────────────────────────────────── */
  const exportAndUpload = async () => {
    if (!img) return toast.error(t("studio.choose"));
    setBusy(true);
    try {
      await Promise.all(FONTS.map((f) => document.fonts?.load?.(`${f.weight} 40px "${f.css}"`) || Promise.resolve()));
      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_W;
      canvas.height = EXPORT_H;
      drawScene(canvas.getContext("2d"), img, view, layers, null, null);
      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
      const fd = new FormData();
      fd.append("file", blob, "thumbnail.jpg");
      const data = await api.post("/stories/upload-thumbnail", fd, { headers: { "Content-Type": "multipart/form-data" } }).then(unwrap);
      // store only the relative path (SSRF rule on story create)
      let path = data.url;
      try { if (/^https?:/.test(path)) path = new URL(path).pathname; } catch { /* keep */ }
      onDone?.({ path, preview: URL.createObjectURL(blob) });
      toast.success(t("studio.uploaded"));
      onClose?.();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  // portal to <body> — Layout's page-transition filter would otherwise trap
  // position:fixed inside the animated page wrapper
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="ts-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={busy ? undefined : onClose} />
          <motion.div
            className="ts-panel"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            {/* header */}
            <div className="between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-solid)" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{t("studio.title")}</div>
                <div className="tertiary" style={{ fontSize: 11.5 }}>{t("studio.subtitle")}</div>
              </div>
              <button onClick={onClose} disabled={busy} aria-label={t("common.cancel")} className="rd-iconbtn" style={{ color: "var(--text-secondary)" }}>
                <X size={20} />
              </button>
            </div>

            <div className="ts-body">
              {/* ── stage: the poster canvas with live Home-card chrome ────── */}
              <div className="ts-stage">
                <div className="ts-poster">
                  <canvas
                    ref={canvasRef}
                    width={EXPORT_W}
                    height={EXPORT_H}
                    className="ts-canvas"
                    style={{ touchAction: "none", cursor: img ? "grab" : "pointer" }}
                    onPointerDown={img ? onPointerDown : () => fileRef.current?.click()}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    onWheel={onWheel}
                  />
                  {!img && (
                    <button className="ts-empty" onClick={() => fileRef.current?.click()}>
                      <ImagePlus size={30} />
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{t("studio.choose")}</span>
                      <span className="tertiary" style={{ fontSize: 11.5 }}>{t("studio.ratioNote")}</span>
                    </button>
                  )}
                  {/* Home-card chrome preview (non-interactive) */}
                  {img && (
                    <div className="ts-chrome" aria-hidden>
                      <div className="ts-chrome-bar">
                        <BookOpen size={12} color="#fff" />
                        <span>{t("card.part")}</span>
                      </div>
                    </div>
                  )}
                </div>
                {img && (
                  <div className="row gap-6 tertiary center" style={{ fontSize: 11.5, justifyContent: "center" }}>
                    <Move size={12} /> {t("studio.dragHint")}
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
              </div>

              {/* ── controls ────────────────────────────────────────────────── */}
              <div className="ts-side">
                {/* image */}
                <div className="rd-pop-label" style={{ color: "var(--text-tertiary)" }}>{t("creator.thumbnail")}</div>
                <div className="row gap-8">
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
                    <ImagePlus size={15} /> {img ? t("studio.change") : t("studio.choose")}
                  </button>
                </div>
                {img && (
                  <div className="row gap-8" style={{ marginTop: 10 }}>
                    <ZoomIn size={15} className="tertiary" />
                    <input
                      type="range" min={100} max={400} value={view.zoom * 100}
                      onChange={(e) => setView((v) => clampView({ ...v, zoom: Number(e.target.value) / 100 }, img))}
                      className="ts-range" aria-label={t("studio.zoom")}
                    />
                  </div>
                )}

                {/* text layers */}
                <div className="between" style={{ marginTop: 18 }}>
                  <div className="rd-pop-label" style={{ margin: 0, color: "var(--text-tertiary)" }}>{t("studio.text")}</div>
                  <button className="btn btn-outline btn-sm" style={{ height: 32, fontSize: 12 }} onClick={addLayer} disabled={!img || layers.length >= 3}>
                    <Type size={14} /> {t("studio.addText")}
                  </button>
                </div>

                {layers.length > 1 && (
                  <div className="row" style={{ gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {layers.map((l, i) => (
                      <button key={l.id} className={`chip ${selectedId === l.id ? "active" : ""}`} style={{ height: 30, fontSize: 12, padding: "0 12px" }} onClick={() => setSelectedId(l.id)}>
                        <span className="clamp-1" style={{ maxWidth: 90 }}>{l.text.trim() || `${t("studio.text")} ${i + 1}`}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selected && (
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      className="input" rows={2}
                      value={selected.text}
                      placeholder={t("studio.textPlaceholder")}
                      onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                      style={{ fontSize: 14 }}
                    />
                    <div className="tertiary" style={{ fontSize: 11, marginTop: 6 }}>{t("studio.textHint")}</div>

                    {/* font */}
                    <div className="rd-pop-label" style={{ color: "var(--text-tertiary)" }}>{t("studio.font")}</div>
                    <div className="rd-seg" style={{ flexWrap: "wrap" }}>
                      {FONTS.map((f) => (
                        <button
                          key={f.css}
                          className={selected.font === f.css ? "on" : ""}
                          onClick={() => updateLayer(selected.id, { font: f.css })}
                          style={{ fontFamily: `"${f.css}"`, fontWeight: f.weight, minWidth: 0 }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* size */}
                    <div className="rd-pop-label" style={{ color: "var(--text-tertiary)" }}>{t("studio.size")}</div>
                    <input
                      type="range" min={30} max={140} value={selected.size}
                      onChange={(e) => updateLayer(selected.id, { size: Number(e.target.value) })}
                      className="ts-range" aria-label={t("studio.size")}
                    />

                    {/* colour */}
                    <div className="rd-pop-label" style={{ color: "var(--text-tertiary)" }}>{t("studio.color")}</div>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateLayer(selected.id, { color: c })}
                          aria-label={c}
                          className="ts-swatch"
                          style={{ background: c, outline: selected.color === c ? "3px solid var(--indigo-400)" : "1px solid var(--border-dark)" }}
                        />
                      ))}
                    </div>

                    {/* effects */}
                    <div className="rd-pop-label" style={{ color: "var(--text-tertiary)" }}>{t("studio.effects")}</div>
                    <div className="rd-seg">
                      <button className={selected.shadow ? "on" : ""} onClick={() => updateLayer(selected.id, { shadow: !selected.shadow })}>
                        <Droplets size={14} /> {t("studio.shadow")}
                      </button>
                      <button className={selected.outline ? "on" : ""} onClick={() => updateLayer(selected.id, { outline: !selected.outline })}>
                        <Square size={14} /> {t("studio.outline")}
                      </button>
                      <button className={selected.plate ? "on" : ""} onClick={() => updateLayer(selected.id, { plate: !selected.plate })}>
                        <RectangleHorizontal size={14} /> {t("studio.plate")}
                      </button>
                    </div>

                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, color: "var(--error)" }} onClick={() => removeLayer(selected.id)}>
                      <Trash2 size={14} /> {t("studio.removeText")}
                    </button>
                  </div>
                )}

                {/* footer actions */}
                <div className="row gap-10" style={{ marginTop: "auto", paddingTop: 18 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={busy}>{t("common.cancel")}</button>
                  <button className="btn btn-primary" style={{ flex: 1.6 }} onClick={exportAndUpload} disabled={busy || !img}>
                    {busy ? <><Loader2 size={17} className="spin" /> {t("studio.uploading")}</> : <><Check size={17} /> {t("studio.use")}</>}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
