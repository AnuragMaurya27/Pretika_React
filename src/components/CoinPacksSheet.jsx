import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Coins, Sparkles, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAuth } from "../store/auth";
import { errMsg } from "../lib/api";
import { useRechargePacks, useInitiateRecharge, useVerifyRecharge } from "../lib/wallet";
import { openCheckout } from "../lib/razorpay";
import { SkeletonBox } from "./Skeleton";

/**
 * Coin pack picker + Razorpay checkout (spec 4.1). Portal bottom-sheet —
 * usable from the Wallet page and inline from the insufficient-balance
 * unlock flow (spec 4.2: "make it one tap").
 */
export default function CoinPacksSheet({ open, onClose, onPurchased }) {
  return createPortal(
    <AnimatePresence>
      {open && <SheetInner onClose={onClose} onPurchased={onPurchased} />}
    </AnimatePresence>,
    document.body
  );
}

function SheetInner({ onClose, onPurchased }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const packs = useRechargePacks();
  const initiate = useInitiateRecharge();
  const verify = useVerifyRecharge();
  const [busyPack, setBusyPack] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const buy = async (pack) => {
    if (busyPack) return;
    setBusyPack(pack.id);
    try {
      const order = await initiate.mutateAsync(pack.id);
      let resp;
      try {
        resp = await openCheckout({
          orderId: order.order_id,
          amountInr: order.amount_inr,
          description: `${pack.total_coins} coins`,
          prefill: { email: user?.email || "" },
        });
      } catch (e) {
        if (e?.message === "dismissed") return; // user closed checkout — no toast
        toast.error(t("wallet.paymentFailed"));
        return;
      }
      // Fast-path verify; webhook + reconciliation are the safety net (spec 4.1)
      try {
        await verify.mutateAsync({
          transaction_id: order.transaction_id,
          gateway_transaction_id: resp.razorpay_payment_id,
          gateway_signature: resp.razorpay_signature,
        });
        toast.success(t("wallet.coinsAdded", { count: pack.total_coins }));
        onPurchased?.();
        onClose?.();
      } catch {
        // Payment captured but verify failed — coins arrive via webhook shortly
        toast.success(t("wallet.paymentReceivedPending"));
        onClose?.();
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusyPack(null);
    }
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
          role="dialog" aria-modal="true" aria-label={t("wallet.buyCoins")}
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
        >
          <div className="fls-grip" aria-hidden />

          <div className="between fls-head">
            <span className="row gap-8" style={{ fontWeight: 800, fontSize: 18 }}>
              <Coins size={18} color="var(--gold)" /> {t("wallet.buyCoins")}
            </span>
            <button onClick={onClose} className="fls-close" aria-label={t("common.close")}>
              <X size={19} />
            </button>
          </div>

          <div style={{ overflowY: "auto", minHeight: 0 }}>
            {packs.isLoading ? (
              <div style={{ display: "grid", gap: 10 }}>
                {[0, 1, 2, 3, 4].map((i) => <SkeletonBox key={i} h={64} r={14} />)}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {(packs.data || []).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => buy(p)}
                    disabled={!!busyPack}
                    className="row between"
                    style={{
                      width: "100%", textAlign: "left", padding: "13px 15px",
                      borderRadius: 14, cursor: "pointer",
                      background: p.is_popular ? "var(--indigo-50)" : "var(--bg-secondary)",
                      border: `1.5px solid ${p.is_popular ? "var(--indigo-600)" : "var(--border-dark)"}`,
                      opacity: busyPack && busyPack !== p.id ? 0.5 : 1,
                    }}
                  >
                    <div>
                      <div className="row gap-8" style={{ fontWeight: 800, fontSize: 15.5 }}>
                        <Coins size={15} color="var(--gold)" />
                        {p.total_coins} {t("wallet.coins")}
                        {p.is_popular && (
                          <span className="badge badge-indigo row gap-4" style={{ fontSize: 10.5 }}>
                            <Sparkles size={10} /> {t("wallet.popular")}
                          </span>
                        )}
                      </div>
                      {p.bonus_coins > 0 && (
                        <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                          {t("wallet.bonusIncluded", { base: p.coins, bonus: p.bonus_coins })}
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "var(--indigo-600)", flexShrink: 0 }}>
                      {busyPack === p.id ? "…" : `₹${Math.round(p.amount_inr)}`}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="row gap-8 muted" style={{ fontSize: 11.5, margin: "14px 2px 4px" }}>
              <ShieldCheck size={13} style={{ flexShrink: 0 }} />
              {t("wallet.secureNote")}
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
