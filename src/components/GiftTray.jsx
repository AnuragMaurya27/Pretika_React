import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Gift, Coins, Flame, Skull, Ghost, Crown, AudioLines } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { errMsg } from "../lib/api";
import { useWallet, useGiftCatalog, useSendGift } from "../lib/wallet";
import { useLang } from "../store/lang";
import { uiCode } from "../i18n";
import CoinPacksSheet from "./CoinPacksSheet";
import { SkeletonBox } from "./Skeleton";

// Catalog icon key → lucide (no platform emoji — SVG renders identically everywhere)
const GIFT_ICONS = {
  diya: Flame,
  cheekh: AudioLines,
  kapaal: Skull,
  aatma: Ghost,
  pishachraja: Crown,
};

/**
 * Horror gift tray (spec 4.3): pick → coins deducted → creator credited 60%
 * instantly → gift animation plays. Portal sheet + full-screen fly-up overlay.
 */
export default function GiftTray({ open, onClose, creatorId, storyId, episodeId, creatorName }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <TrayInner
          onClose={onClose}
          creatorId={creatorId}
          storyId={storyId}
          episodeId={episodeId}
          creatorName={creatorName}
        />
      )}
    </AnimatePresence>,
    document.body
  );
}

function TrayInner({ onClose, creatorId, storyId, episodeId, creatorName }) {
  const { t } = useTranslation();
  const lang = useLang((s) => s.lang);
  const code = uiCode(lang);
  const wallet = useWallet();
  const catalog = useGiftCatalog();
  const send = useSendGift();
  const [selected, setSelected] = useState(null);
  const [showPacks, setShowPacks] = useState(false);
  const [flying, setFlying] = useState(null); // gift being animated after send

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const balance = wallet.data?.coin_balance ?? 0;
  const gifts = catalog.data || [];
  const giftName = (g) => (code === "hi" ? g.name_hi || g.name : g.name);

  const doSend = () => {
    if (!selected || send.isPending) return;
    if (balance < selected.coin_cost) {
      setShowPacks(true);
      return;
    }
    send.mutate(
      {
        gift_id: selected.id,
        creator_id: creatorId,
        story_id: storyId || undefined,
        episode_id: episodeId || undefined,
      },
      {
        onSuccess: () => {
          setFlying(selected);
          toast.success(t("gift.sent", { gift: giftName(selected), name: creatorName || "" }));
          setTimeout(() => {
            setFlying(null);
            onClose?.();
          }, 1600);
        },
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
          role="dialog" aria-modal="true" aria-label={t("gift.title")}
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
        >
          <div className="fls-grip" aria-hidden />

          <div className="between fls-head">
            <span className="row gap-8" style={{ fontWeight: 800, fontSize: 18 }}>
              <Gift size={18} color="var(--indigo-600)" /> {t("gift.title")}
            </span>
            <span className="row gap-4 muted" style={{ fontSize: 12.5, fontWeight: 700 }}>
              <Coins size={13} color="var(--gold)" /> {wallet.isLoading ? "…" : balance.toLocaleString("en-IN")}
            </span>
            <button onClick={onClose} className="fls-close" aria-label={t("common.close")}>
              <X size={19} />
            </button>
          </div>

          <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
            {t("gift.sub", { name: creatorName || t("gift.theCreator") })}
          </p>

          <div style={{ overflowY: "auto", minHeight: 0 }}>
            {catalog.isLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[0, 1, 2, 3, 4].map((i) => <SkeletonBox key={i} h={92} r={14} />)}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {gifts.map((g) => {
                  const Icon = GIFT_ICONS[g.icon] || Gift;
                  const on = selected?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelected(g)}
                      style={{
                        padding: "14px 8px 11px", borderRadius: 14, textAlign: "center",
                        display: "grid", justifyItems: "center", gap: 6, cursor: "pointer",
                        background: on ? "var(--indigo-50)" : "var(--bg-secondary)",
                        border: `1.5px solid ${on ? "var(--indigo-600)" : "transparent"}`,
                        transition: "background .15s ease, border-color .15s ease",
                      }}
                    >
                      <Icon size={26} color={on ? "var(--indigo-600)" : "var(--text-secondary)"} />
                      <span style={{ fontWeight: 700, fontSize: 12.5 }}>{giftName(g)}</span>
                      <span className="row gap-4" style={{ fontSize: 11.5, fontWeight: 800, color: "var(--gold)" }}>
                        <Coins size={11} /> {g.coin_cost}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 14 }}
            disabled={!selected || send.isPending}
            onClick={doSend}
          >
            {send.isPending
              ? "…"
              : selected && balance < selected.coin_cost
                ? t("wallet.buyCoins")
                : selected
                  ? t("gift.cta", { gift: giftName(selected), n: selected.coin_cost })
                  : t("gift.pick")}
          </button>
        </motion.div>
      </div>

      {/* fly-up gift animation (spec 4.3: gifts animate on screen) */}
      <AnimatePresence>
        {flying && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 220, display: "grid",
              placeItems: "center", pointerEvents: "none",
            }}
          >
            {(() => {
              const Icon = GIFT_ICONS[flying.icon] || Gift;
              return (
                <motion.div
                  initial={{ scale: 0.3, y: 130, opacity: 0, rotate: -14 }}
                  animate={{ scale: [0.3, 1.35, 1], y: [130, -30, -60], opacity: [0, 1, 1], rotate: 0 }}
                  transition={{ duration: 1.25, times: [0, 0.45, 1], ease: "easeOut" }}
                  style={{
                    textAlign: "center", background: "#160404", color: "#fff",
                    padding: "26px 34px", borderRadius: 22, boxShadow: "0 30px 80px rgba(0,0,0,.55)",
                  }}
                >
                  <Icon size={54} color="#ffb43a" />
                  <div className="serif" style={{ fontSize: 19, fontWeight: 800, marginTop: 8 }}>
                    {giftName(flying)}
                  </div>
                  <div style={{ fontSize: 12, color: "#cda3a3", marginTop: 2 }}>
                    {t("gift.flyNote", { name: creatorName || "" })}
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <CoinPacksSheet
        open={showPacks}
        onClose={() => setShowPacks(false)}
        onPurchased={() => wallet.refetch()}
      />
    </>
  );
}
