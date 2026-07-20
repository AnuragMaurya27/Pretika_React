import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Lock, Coins, Unlock } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { errMsg } from "../lib/api";
import { useWallet, useUnlockEpisode } from "../lib/wallet";
import CoinPacksSheet from "./CoinPacksSheet";

/**
 * Locked-chapter unlock confirm (spec 4.2): price + balance → one-tap unlock,
 * permanent for this reader. Insufficient balance pivots straight into the
 * coin-packs sheet — that pivot is the platform's main purchase trigger.
 */
export default function UnlockSheet({ open, onClose, episode, onUnlocked }) {
  return createPortal(
    <AnimatePresence>
      {open && episode && (
        <SheetInner onClose={onClose} episode={episode} onUnlocked={onUnlocked} />
      )}
    </AnimatePresence>,
    document.body
  );
}

function SheetInner({ onClose, episode, onUnlocked }) {
  const { t } = useTranslation();
  const wallet = useWallet();
  const unlock = useUnlockEpisode();
  const [showPacks, setShowPacks] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cost = episode.unlock_coin_cost || 0;
  const balance = wallet.data?.coin_balance ?? 0;
  const enough = balance >= cost;

  const doUnlock = () => {
    if (unlock.isPending) return;
    unlock.mutate(episode.id, {
      onSuccess: () => {
        toast.success(t("unlock.done"));
        onUnlocked?.(episode);
        onClose?.();
      },
      onError: (e) => toast.error(errMsg(e)),
    });
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
          role="dialog" aria-modal="true" aria-label={t("unlock.title")}
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
        >
          <div className="fls-grip" aria-hidden />

          <div className="between fls-head">
            <span className="row gap-8" style={{ fontWeight: 800, fontSize: 18 }}>
              <Lock size={18} color="var(--indigo-600)" /> {t("unlock.title")}
            </span>
            <button onClick={onClose} className="fls-close" aria-label={t("common.close")}>
              <X size={19} />
            </button>
          </div>

          <div style={{ textAlign: "center", padding: "6px 0 4px" }}>
            <div className="clamp-2" style={{ fontWeight: 700, fontSize: 15 }}>
              {t("story.episode")} {episode.episode_number} · {episode.title}
            </div>

            <div
              className="row gap-8"
              style={{
                justifyContent: "center", margin: "16px auto 6px", padding: "12px 22px",
                borderRadius: 16, background: "var(--indigo-50)", width: "fit-content",
              }}
            >
              <Coins size={20} color="var(--gold)" />
              <span style={{ fontWeight: 900, fontSize: 24 }}>{cost}</span>
              <span className="muted" style={{ fontSize: 13 }}>{t("wallet.coins")}</span>
            </div>

            <div className="muted" style={{ fontSize: 12.5 }}>
              {t("unlock.balance")}:{" "}
              <b style={{ color: enough ? "inherit" : "var(--indigo-600)" }}>
                {wallet.isLoading ? "…" : balance.toLocaleString("en-IN")}
              </b>{" "}
              {t("wallet.coins")}
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
              {t("unlock.permanentNote")}
            </p>
          </div>

          {enough ? (
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 12 }}
              disabled={unlock.isPending || wallet.isLoading}
              onClick={doUnlock}
            >
              <Unlock size={16} /> {unlock.isPending ? "…" : t("unlock.cta", { n: cost })}
            </button>
          ) : (
            <>
              <div className="badge badge-red" style={{ margin: "10px auto 0" }}>
                {t("unlock.insufficient")}
              </div>
              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 12 }}
                onClick={() => setShowPacks(true)}
              >
                <Coins size={16} /> {t("wallet.buyCoins")}
              </button>
            </>
          )}
        </motion.div>
      </div>

      <CoinPacksSheet
        open={showPacks}
        onClose={() => setShowPacks(false)}
        onPurchased={() => wallet.refetch()}
      />
    </>
  );
}
