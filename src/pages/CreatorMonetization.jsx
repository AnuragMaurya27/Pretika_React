import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, IndianRupee, CheckCircle2, XCircle, Clock, BadgeCheck,
  Landmark, TrendingUp, Gift, Lock, Megaphone, Banknote, ShieldCheck, Hourglass,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  useMonetizationEligibility, useApplyMonetization, useEarningWallet,
  useEarningLedger, usePayouts, useRequestPayout, useMonetizationPublicConfig,
  paiseToInr,
} from "../lib/wallet";
import { errMsg } from "../lib/api";
import { timeAgo } from "../lib/format";
import EmptyState from "../components/EmptyState";
import { SkeletonBox } from "../components/Skeleton";
import Seo from "../components/Seo";

const LEDGER_META = {
  unlock_credit: { icon: Lock, key: "unlock" },
  gift_credit: { icon: Gift, key: "gift" },
  ad_share_credit: { icon: Megaphone, key: "adShare" },
  hold_release: { icon: Hourglass, key: "holdRelease" },
  payout_debit: { icon: Banknote, key: "payout" },
  payout_refund: { icon: Banknote, key: "payoutRefund" },
  clawback: { icon: XCircle, key: "clawback" },
  admin_adjustment: { icon: BadgeCheck, key: "adjustment" },
};

const PAYOUT_BADGE = {
  requested: "badge-gold", approved: "badge-blue", processing: "badge-blue",
  paid: "badge-green", rejected: "badge-red", failed: "badge-red",
};

/**
 * Creator monetization hub (spec 5): eligibility + KYC application for
 * non-monetized creators; earnings wallet, traceable ledger and payouts
 * once approved.
 */
export default function CreatorMonetization() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const eligibility = useMonetizationEligibility();
  const e = eligibility.data;
  const approved = e?.kyc_status === "approved";

  return (
    <div className="app-shell" style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <Seo title={t("monetization.title")} robots="noindex, nofollow" />

      <header className="container between" style={{ height: 56 }}>
        <div className="row gap-12">
          <button className="only-mobile" onClick={() => nav(-1)} aria-label={t("common.back")}>
            <ArrowLeft size={22} />
          </button>
          <div className="section-title">{t("monetization.title")}</div>
        </div>
        {approved && (
          <span className="badge badge-green row gap-4">
            <BadgeCheck size={12} /> {t("monetization.active")} · Tier {e.tier}
          </span>
        )}
      </header>

      <div className="container" style={{ paddingTop: 4, paddingBottom: 48, maxWidth: 760 }}>
        {eligibility.isLoading ? (
          <div style={{ display: "grid", gap: 12 }}>
            {[0, 1, 2].map((i) => <SkeletonBox key={i} h={90} r={14} />)}
          </div>
        ) : approved ? (
          <EarningsPanel tier={e.tier} />
        ) : (
          <ApplyPanel e={e} />
        )}
      </div>
    </div>
  );
}

/* ── Apply flow: eligibility checklist + KYC form (spec 5.1) ─────────────── */

function ApplyPanel({ e }) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);

  if (e?.kyc_status === "pending") {
    return (
      <EmptyState
        icon={<Clock size={32} />}
        title={t("monetization.pendingTitle")}
        sub={t("monetization.pendingSub")}
      />
    );
  }

  const checks = [
    {
      ok: (e?.completed_stories ?? 0) >= (e?.required_completed_stories ?? 1)
        || (e?.published_chapters ?? 0) >= (e?.required_published_chapters ?? 5),
      label: t("monetization.checkContent", {
        stories: e?.required_completed_stories ?? 1,
        chapters: e?.required_published_chapters ?? 5,
      }),
      detail: t("monetization.checkContentNow", {
        stories: e?.completed_stories ?? 0,
        chapters: e?.published_chapters ?? 0,
      }),
    },
    {
      ok: (e?.valid_reads ?? 0) >= (e?.required_valid_reads ?? 500),
      label: t("monetization.checkReads", { n: e?.required_valid_reads ?? 500 }),
      detail: t("monetization.checkReadsNow", { n: e?.valid_reads ?? 0 }),
    },
    {
      ok: (e?.account_age_days ?? 0) >= (e?.required_account_age_days ?? 14),
      label: t("monetization.checkAge", { n: e?.required_account_age_days ?? 14 }),
      detail: t("monetization.checkAgeNow", { n: e?.account_age_days ?? 0 }),
    },
    {
      ok: !e?.has_active_strikes,
      label: t("monetization.checkStrikes"),
      detail: e?.has_active_strikes ? t("monetization.checkStrikesBad") : t("monetization.checkStrikesOk"),
    },
  ];

  return (
    <>
      {e?.kyc_status === "rejected" && (
        <div className="card" style={{ padding: 14, marginBottom: 14, borderLeft: "3px solid var(--indigo-600)" }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{t("monetization.rejectedTitle")}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {e.rejection_reason || t("monetization.rejectedSub")}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 18 }}>
        <div className="row gap-8" style={{ fontWeight: 800, fontSize: 16 }}>
          <IndianRupee size={17} color="var(--indigo-600)" /> {t("monetization.applyTitle")}
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
          {t("monetization.applySub")}
        </p>

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          {checks.map((c, i) => (
            <div key={i} className="row gap-12" style={{ alignItems: "flex-start" }}>
              {c.ok
                ? <CheckCircle2 size={18} color="var(--green, #1a7f37)" style={{ flexShrink: 0, marginTop: 1 }} />
                : <XCircle size={18} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 1 }} />}
              <div>
                <div style={{ fontWeight: 650, fontSize: 13.5 }}>{c.label}</div>
                <div className="muted" style={{ fontSize: 12 }}>{c.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {e?.is_eligible ? (
          showForm
            ? <KycForm />
            : (
              <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={() => setShowForm(true)}>
                {t("monetization.startKyc")}
              </button>
            )
        ) : (
          <p className="muted" style={{ fontSize: 12.5, marginTop: 16 }}>{t("monetization.notEligibleNote")}</p>
        )}
      </div>
    </>
  );
}

function KycForm() {
  const { t } = useTranslation();
  const apply = useApplyMonetization();
  const [form, setForm] = useState({
    legal_name: "", pan: "", address: "", payout_method: "upi",
    upi_id: "", bank_account_number: "", bank_ifsc: "", bank_account_holder: "", bank_name: "",
  });
  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));

  const panOk = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan.trim().toUpperCase());
  const destOk = form.payout_method === "upi"
    ? form.upi_id.trim().includes("@")
    : form.bank_account_number.trim().length >= 6 && form.bank_ifsc.trim().length >= 8 && form.bank_account_holder.trim().length >= 3;
  const valid = form.legal_name.trim().length >= 3 && panOk && form.address.trim().length >= 10 && destOk;

  const submit = (ev) => {
    ev.preventDefault();
    if (!valid || apply.isPending) return;
    apply.mutate(
      { ...form, pan: form.pan.trim().toUpperCase() },
      {
        onSuccess: () => toast.success(t("monetization.applied")),
        onError: (err) => toast.error(errMsg(err)),
      }
    );
  };

  return (
    <form onSubmit={submit} style={{ marginTop: 18 }}>
      <div className="eyebrow row gap-8" style={{ marginBottom: 10 }}>
        <ShieldCheck size={13} /> {t("monetization.kycTitle")}
      </div>
      <div className="field">
        <label className="field-label">{t("monetization.legalName")}</label>
        <input className="input" value={form.legal_name} onChange={set("legal_name")} maxLength={150} />
      </div>
      <div className="field">
        <label className="field-label">{t("monetization.pan")}</label>
        <input
          className="input" value={form.pan} onChange={set("pan")} maxLength={10}
          placeholder="ABCDE1234F" style={{ textTransform: "uppercase" }}
        />
      </div>
      <div className="field">
        <label className="field-label">{t("monetization.address")}</label>
        <textarea className="input" style={{ height: 72, paddingTop: 10, resize: "vertical" }}
          value={form.address} onChange={set("address")} maxLength={500} />
      </div>

      <div className="field">
        <label className="field-label">{t("monetization.payoutMethod")}</label>
        <div className="row gap-8">
          {["upi", "bank_transfer"].map((m) => (
            <button
              key={m} type="button"
              className="badge"
              onClick={() => setForm((f) => ({ ...f, payout_method: m }))}
              style={{
                padding: "9px 16px", fontSize: 12.5, cursor: "pointer",
                background: form.payout_method === m ? "var(--indigo-600)" : "var(--bg-card)",
                color: form.payout_method === m ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${form.payout_method === m ? "var(--indigo-600)" : "var(--border-dark)"}`,
              }}
            >
              {t(`monetization.method.${m}`)}
            </button>
          ))}
        </div>
      </div>

      {form.payout_method === "upi" ? (
        <div className="field">
          <label className="field-label">{t("monetization.upiId")}</label>
          <input className="input" value={form.upi_id} onChange={set("upi_id")} placeholder="name@upi" />
        </div>
      ) : (
        <>
          <div className="field">
            <label className="field-label">{t("monetization.accountHolder")}</label>
            <input className="input" value={form.bank_account_holder} onChange={set("bank_account_holder")} />
          </div>
          <div className="field">
            <label className="field-label">{t("monetization.accountNumber")}</label>
            <input className="input" value={form.bank_account_number} onChange={set("bank_account_number")} inputMode="numeric" />
          </div>
          <div className="field">
            <label className="field-label">IFSC</label>
            <input className="input" value={form.bank_ifsc} onChange={set("bank_ifsc")} maxLength={11} style={{ textTransform: "uppercase" }} />
          </div>
          <div className="field">
            <label className="field-label">{t("monetization.bankName")}</label>
            <input className="input" value={form.bank_name} onChange={set("bank_name")} />
          </div>
        </>
      )}

      <p className="muted" style={{ fontSize: 11.5, margin: "4px 0 12px", lineHeight: 1.5 }}>
        {t("monetization.kycNote")}
      </p>
      <button className="btn btn-primary btn-block" disabled={!valid || apply.isPending}>
        {apply.isPending ? "…" : t("monetization.submitKyc")}
      </button>
    </form>
  );
}

/* ── Earnings + payouts (spec 5.3 / 5.4) ─────────────────────────────────── */

function EarningsPanel({ tier }) {
  const { t } = useTranslation();
  const wallet = useEarningWallet();
  const ledger = useEarningLedger();
  const payouts = usePayouts();
  const requestPayout = useRequestPayout();
  const cfg = useMonetizationPublicConfig();
  const [tab, setTab] = useState("ledger");

  const w = wallet.data || {};
  const minPayout = cfg.data?.min_payout_paise ?? 50000;
  const canPayout = (w.available_paise ?? 0) >= minPayout;
  const hasOpenPayout = (payouts.data?.items || []).some((p) =>
    ["requested", "approved", "processing"].includes(p.status));

  const doPayout = () => {
    if (requestPayout.isPending) return;
    requestPayout.mutate(w.available_paise, {
      onSuccess: () => toast.success(t("monetization.payoutRequested")),
      onError: (err) => toast.error(errMsg(err)),
    });
  };

  const share = cfg.data?.[`tier_share_${tier}`] ?? [45, 50, 60][Math.max(0, (tier || 1) - 1)];

  return (
    <>
      {/* wallet summary */}
      <div
        className="card"
        style={{
          padding: "20px 18px", marginBottom: 14,
          background: "linear-gradient(150deg, var(--indigo-50), var(--bg-card))",
        }}
      >
        <div className="row between" style={{ flexWrap: "wrap", gap: 14 }}>
          <div>
            <div className="muted row gap-8" style={{ fontSize: 12.5 }}>
              <Landmark size={14} /> {t("monetization.available")}
            </div>
            <div style={{ fontWeight: 900, fontSize: 30, marginTop: 4 }}>
              {wallet.isLoading ? "…" : paiseToInr(w.available_paise)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="muted row gap-4" style={{ fontSize: 12, justifyContent: "flex-end" }}>
              <Hourglass size={12} /> {t("monetization.onHold")}
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, marginTop: 2 }}>{paiseToInr(w.on_hold_paise)}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
              {t("monetization.lifetime")}: {paiseToInr(w.lifetime_earned_paise)}
            </div>
          </div>
        </div>

        <div className="row gap-8" style={{ marginTop: 14, flexWrap: "wrap" }}>
          <span className="badge badge-indigo row gap-4">
            <TrendingUp size={11} /> {t("monetization.tierShare", { tier, share })}
          </span>
          <span className="badge badge-gold">
            {t("monetization.holdNote", { n: cfg.data?.earning_hold_days ?? 7 })}
          </span>
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          disabled={!canPayout || hasOpenPayout || requestPayout.isPending}
          onClick={doPayout}
        >
          <Banknote size={16} />
          {hasOpenPayout
            ? t("monetization.payoutInProgress")
            : canPayout
              ? t("monetization.requestPayout", { amount: paiseToInr(w.available_paise) })
              : t("monetization.minPayoutNote", { amount: paiseToInr(minPayout) })}
        </button>
      </div>

      {/* tabs: ledger | payouts */}
      <div className="row gap-8" style={{ borderBottom: "1px solid var(--border-solid)", marginBottom: 12 }}>
        {["ledger", "payouts"].map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              position: "relative", padding: "10px 4px", fontWeight: 700, fontSize: 14,
              color: tab === k ? "var(--indigo-600)" : "var(--text-tertiary)", marginBottom: -1,
            }}
          >
            {t(`monetization.tab.${k}`)}
            {tab === k && (
              <motion.span
                layoutId="mone-tab"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2.5, borderRadius: 2, background: "var(--indigo-600)" }}
              />
            )}
          </button>
        ))}
      </div>

      {tab === "ledger" ? (
        ledger.isLoading ? (
          <div style={{ display: "grid", gap: 10 }}>{[0, 1, 2].map((i) => <SkeletonBox key={i} h={58} r={14} />)}</div>
        ) : (ledger.data?.items || []).length === 0 ? (
          <EmptyState icon={<IndianRupee size={30} />} title={t("monetization.ledgerEmpty")} sub={t("monetization.ledgerEmptySub")} />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {(ledger.data?.items || []).map((en) => {
              const meta = LEDGER_META[en.entry_type] || { icon: IndianRupee, key: "other" };
              const Icon = meta.icon;
              const positive = en.amount_paise > 0;
              return (
                <div key={en.id} className="card row between" style={{ padding: "12px 14px", gap: 12 }}>
                  <div className="row gap-12" style={{ minWidth: 0 }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center",
                      background: "var(--bg-secondary)", color: "var(--indigo-600)", flexShrink: 0,
                    }}>
                      <Icon size={16} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="clamp-1" style={{ fontWeight: 700, fontSize: 13.5 }}>
                        {t(`monetization.ledger.${meta.key}`, { defaultValue: en.description || en.entry_type })}
                      </div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                        {timeAgo(en.created_at)}
                        {en.balance_bucket === "on_hold" && !en.released && (
                          <span className="badge badge-gold" style={{ marginLeft: 6, fontSize: 10 }}>
                            {t("monetization.held")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 800, fontSize: 14, flexShrink: 0,
                    color: positive ? "var(--green, #1a7f37)" : "var(--text-primary)",
                  }}>
                    {positive ? "+" : ""}{paiseToInr(en.amount_paise)}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : payouts.isLoading ? (
        <div style={{ display: "grid", gap: 10 }}>{[0, 1].map((i) => <SkeletonBox key={i} h={70} r={14} />)}</div>
      ) : (payouts.data?.items || []).length === 0 ? (
        <EmptyState icon={<Banknote size={30} />} title={t("monetization.payoutsEmpty")} sub={t("monetization.payoutsEmptySub")} />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {(payouts.data?.items || []).map((p) => (
            <div key={p.id} className="card" style={{ padding: "13px 15px" }}>
              <div className="row between" style={{ gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{paiseToInr(p.amount_paise)}</div>
                <span className={`badge ${PAYOUT_BADGE[p.status] || "badge-indigo"}`}>
                  {t(`monetization.payoutStatus.${p.status}`, { defaultValue: p.status })}
                </span>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 5 }}>
                {t("monetization.payoutBreakdown", { tds: paiseToInr(p.tds_paise), net: paiseToInr(p.net_paise) })}
              </div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>
                {p.payout_method === "upi" ? p.upi_id : p.bank_name} · {timeAgo(p.requested_at)}
                {p.rejection_reason ? ` · ${p.rejection_reason}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
