import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Plus, ArrowDownLeft, ArrowUpRight, Lock, Gift, Wallet as WalletIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWallet, useWalletTransactions } from "../lib/wallet";
import CoinPacksSheet from "../components/CoinPacksSheet";
import EmptyState from "../components/EmptyState";
import { SkeletonBox } from "../components/Skeleton";
import Seo from "../components/Seo";
import { timeAgo } from "../lib/format";

// Reader-facing transaction rendering. Coins are a one-way currency
// (spec 2.1): they buy unlocks & gifts, never convert back to money.
const TX_META = {
  recharge: { icon: ArrowDownLeft, color: "var(--green, #1a7f37)", key: "recharge", in: true },
  premium_unlock: { icon: Lock, color: "var(--indigo-600)", key: "unlock" },
  appreciation: { icon: Gift, color: "var(--indigo-600)", key: "gift" },
  signup_bonus: { icon: Plus, color: "var(--gold)", key: "bonus", in: true },
  daily_login_bonus: { icon: Plus, color: "var(--gold)", key: "bonus", in: true },
  referral_bonus: { icon: Plus, color: "var(--gold)", key: "bonus", in: true },
  admin_credit: { icon: Plus, color: "var(--gold)", key: "bonus", in: true },
};

export default function Wallet() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const wallet = useWallet();
  const txs = useWalletTransactions();
  const [showPacks, setShowPacks] = useState(false);

  const balance = wallet.data?.coin_balance ?? 0;
  const items = txs.data?.items || [];

  return (
    <div className="app-shell" style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <Seo title={t("wallet.title")} robots="noindex, nofollow" />

      <header className="container between" style={{ height: 56 }}>
        <div className="row gap-12">
          <button className="only-mobile" onClick={() => nav(-1)} aria-label={t("common.back")}>
            <ArrowLeft size={22} />
          </button>
          <div className="section-title">{t("wallet.title")}</div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: 4, paddingBottom: 48, maxWidth: 680 }}>
        {/* balance card */}
        <div
          className="card"
          style={{
            padding: "22px 20px", marginBottom: 18, textAlign: "center",
            background: "linear-gradient(150deg, var(--indigo-50), var(--bg-card))",
          }}
        >
          <div className="row gap-8" style={{ justifyContent: "center", color: "var(--text-secondary)", fontSize: 13 }}>
            <WalletIcon size={15} /> {t("wallet.balance")}
          </div>
          <div className="row gap-8" style={{ justifyContent: "center", marginTop: 6 }}>
            <Coins size={26} color="var(--gold)" />
            <span style={{ fontWeight: 900, fontSize: 34, lineHeight: 1 }}>
              {wallet.isLoading ? "…" : balance.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{t("wallet.balanceSub")}</div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 14, minWidth: 180 }}
            onClick={() => setShowPacks(true)}
          >
            <Plus size={16} /> {t("wallet.buyCoins")}
          </button>
        </div>

        {/* one-way currency note (spec: refund policy shown to users) */}
        <p className="muted" style={{ fontSize: 12, margin: "0 4px 18px", lineHeight: 1.5 }}>
          {t("wallet.policyNote")}
        </p>

        {/* transactions */}
        <div className="section-title" style={{ fontSize: 16, marginBottom: 10 }}>
          {t("wallet.history")}
        </div>
        {txs.isLoading ? (
          <div style={{ display: "grid", gap: 10 }}>
            {[0, 1, 2].map((i) => <SkeletonBox key={i} h={62} r={14} />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={<Coins size={30} />} title={t("wallet.emptyTitle")} sub={t("wallet.emptySub")} />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((tx) => {
              const meta = TX_META[tx.transaction_type] || { icon: ArrowUpRight, color: "var(--text-tertiary)", key: "other" };
              const Icon = meta.icon;
              const incoming = !!meta.in;
              return (
                <div key={tx.id} className="card row between" style={{ padding: "12px 14px", gap: 12 }}>
                  <div className="row gap-12" style={{ minWidth: 0 }}>
                    <span
                      className="row"
                      style={{
                        width: 36, height: 36, borderRadius: 12, justifyContent: "center",
                        background: "var(--bg-secondary)", color: meta.color, flexShrink: 0,
                      }}
                    >
                      <Icon size={17} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="clamp-1" style={{ fontWeight: 700, fontSize: 13.5 }}>
                        {t(`wallet.tx.${meta.key}`, { defaultValue: tx.description || tx.transaction_type })}
                      </div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                        {timeAgo(tx.created_at)}
                        {tx.status !== "completed" && (
                          <span className="badge badge-gold" style={{ marginLeft: 6, fontSize: 10 }}>
                            {t(`wallet.txStatus.${tx.status}`, { defaultValue: tx.status })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontWeight: 800, fontSize: 14.5, flexShrink: 0,
                      color: incoming ? "var(--green, #1a7f37)" : "var(--text-primary)",
                    }}
                  >
                    {incoming ? "+" : "−"}{tx.amount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CoinPacksSheet open={showPacks} onClose={() => setShowPacks(false)} />
    </div>
  );
}
