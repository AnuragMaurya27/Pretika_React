import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { X, Coins, Lock, Plus, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

// Shown when a non-follower taps "Message" on a creator who charges for DMs.
// The coins are held in escrow and refunded if the creator doesn't reply in time.
export default function PayToMessageSheet({ open, name, price, balance, sending, onConfirm, onClose }) {
  const { t } = useTranslation();
  if (!open) return null;
  const short = balance < price;

  return createPortal(
    <div className="chat-sheet-backdrop" onClick={onClose}>
      <div className="chat-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="chat-sheet-head">
          <span className="row gap-8"><Lock size={17} color="var(--indigo-600)" /> {t("chat.paidDmTitle")}</span>
          <button className="chat-sheet-x" onClick={onClose} aria-label={t("common.close")}><X size={18} /></button>
        </div>

        <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 14 }}>
          {t("chat.paidDmBody", { name, coins: price })}
        </p>

        <div className="pay-assure">
          <ShieldCheck size={16} color="var(--indigo-600)" />
          <span>{t("chat.paidDmEscrow")}</span>
        </div>

        <div className="between" style={{ marginTop: 14, fontSize: 13 }}>
          <span className="row gap-6 muted">
            <Coins size={14} color="var(--gold)" /> {t("chat.balance")}: <b style={{ color: "var(--text-primary)" }}>{balance}</b>
          </span>
          {short && (
            <Link to="/wallet" className="row gap-4" style={{ color: "var(--crimson)", fontWeight: 700 }}>
              <Plus size={14} /> {t("wallet.buyCoins")}
            </Link>
          )}
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 14 }}
          disabled={short || sending}
          onClick={onConfirm}
        >
          {sending
            ? "…"
            : short
              ? t("chat.notEnoughCoins")
              : <span className="row gap-6" style={{ justifyContent: "center" }}><Coins size={16} /> {t("chat.paidDmPay", { coins: price })}</span>}
        </button>
      </div>
    </div>,
    document.body,
  );
}
