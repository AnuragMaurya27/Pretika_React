import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { X, Coins, Sparkles, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWallet } from "../lib/wallet";
import { SUPERCHAT_TIERS, tierColor } from "../lib/superchat";

export default function SuperChatSheet({ open, onClose, onSend, sending }) {
  const { t } = useTranslation();
  const { data: wallet } = useWallet();
  const balance = wallet?.coin_balance ?? 0;
  const [coins, setCoins] = useState(50);

  if (!open) return null;
  const notEnough = coins > balance;
  const color = tierColor(coins);

  return createPortal(
    <div className="chat-sheet-backdrop" onClick={onClose}>
      <div className="chat-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="chat-sheet-head">
          <span className="row gap-8"><Sparkles size={18} color={color} /> {t("chat.superChat")}</span>
          <button className="chat-sheet-x" onClick={onClose} aria-label={t("common.close")}><X size={18} /></button>
        </div>

        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{t("chat.superChatSub")}</p>

        {/* live preview of the highlighted bubble */}
        <div className="sc-preview" style={{ "--sc": color }}>
          <span className="sc-preview-badge"><Coins size={13} /> {coins}</span>
          <span className="sc-preview-text">{t("chat.superChatPreview")}</span>
        </div>

        {/* amount chips (multiples of 10) */}
        <div className="sc-tiers">
          {SUPERCHAT_TIERS.map((tier) => {
            const active = coins === tier.coins;
            const disabled = tier.coins > balance;
            return (
              <button
                key={tier.coins}
                className={`sc-tier ${active ? "on" : ""}`}
                style={active ? { borderColor: tier.color, color: tier.color } : undefined}
                disabled={disabled}
                onClick={() => setCoins(tier.coins)}
              >
                <Coins size={14} /> {tier.coins}
              </button>
            );
          })}
        </div>

        <div className="between" style={{ marginTop: 14, fontSize: 13 }}>
          <span className="row gap-6 muted"><Coins size={14} color="var(--gold)" /> {t("chat.balance")}: <b style={{ color: "var(--text-primary)" }}>{balance}</b></span>
          {notEnough && (
            <Link to="/wallet" className="row gap-4" style={{ color: "var(--crimson)", fontWeight: 700 }}>
              <Plus size={14} /> {t("wallet.buyCoins")}
            </Link>
          )}
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 14, background: notEnough ? undefined : `linear-gradient(180deg, ${color}, ${color})` }}
          disabled={notEnough || sending}
          onClick={() => onSend(coins, color)}
        >
          {sending ? "…" : notEnough ? t("chat.notEnoughCoins") : t("chat.sendSuperChat", { coins })}
        </button>
      </div>
    </div>,
    document.body,
  );
}
