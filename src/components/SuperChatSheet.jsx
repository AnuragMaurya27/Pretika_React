import { useEffect, useRef, useState } from "react";
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
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  // Drop focus into the message field each time the sheet opens — the whole
  // point is that you write the message right here, inside Super Chat.
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  if (!open) return null;
  const notEnough = coins > balance;
  const color = tierColor(coins);
  const submit = () => {
    if (notEnough || sending) return;
    onSend(coins, color, message.trim());
    setMessage("");
  };

  return createPortal(
    <div className="chat-sheet-backdrop" onClick={onClose}>
      <div className="chat-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="chat-sheet-head">
          <span className="row gap-8"><Sparkles size={18} color={color} /> {t("chat.superChat")}</span>
          <button className="chat-sheet-x" onClick={onClose} aria-label={t("common.close")}><X size={18} /></button>
        </div>

        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{t("chat.superChatSub")}</p>

        {/* the highlighted bubble doubles as the message field — type right here */}
        <div className="sc-preview" style={{ "--sc": color }}>
          <span className="sc-preview-badge"><Coins size={13} /> {coins} · {t("chat.superChat")}</span>
          <input
            ref={inputRef}
            className="sc-preview-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t("chat.superChatPreview")}
            maxLength={300}
          />
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
          onClick={submit}
        >
          {sending ? "…" : notEnough ? t("chat.notEnoughCoins") : t("chat.sendSuperChat", { coins })}
        </button>
      </div>
    </div>,
    document.body,
  );
}
