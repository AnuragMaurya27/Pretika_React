import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Coins, Copy, Check, Share2, UserPlus, MailCheck,
  BookOpen, Wallet as WalletIcon, TrendingUp, Users, ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useMyReferral, useSyncReferral, referralUrl } from "../lib/referral";
import { useAuth } from "../store/auth";
import EmptyState from "../components/EmptyState";
import { SkeletonBox } from "../components/Skeleton";
import Seo from "../components/Seo";
import Img from "../components/Img";
import { timeAgo } from "../lib/format";

/* ═══ Invite & Earn ("Bulawa") ═══
   The reward ladder is deliberately back-loaded: signup pays nothing, so a
   referrer only earns from friends who actually verify, read, and recharge.
   Every number rendered here comes from the API (coin_config) — never hardcode. */

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="card" style={{ padding: "14px 10px", textAlign: "center", flex: 1, minWidth: 0 }}>
      <Icon size={16} color="var(--indigo-600)" />
      <div style={{ fontWeight: 900, fontSize: 22, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Rung({ icon: Icon, step, title, reward, muted }) {
  return (
    <div className="row gap-12" style={{ alignItems: "flex-start", padding: "12px 0" }}>
      <div
        aria-hidden
        style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          display: "grid", placeItems: "center",
          background: muted ? "var(--bg-subtle, #f4f1ec)" : "var(--indigo-50)",
          color: muted ? "var(--text-secondary)" : "var(--indigo-600)",
        }}
      >
        <Icon size={17} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>{step}</div>
        <div style={{ fontWeight: 700, fontSize: 14, marginTop: 1 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--indigo-600)", fontWeight: 700, marginTop: 3 }}>{reward}</div>
      </div>
    </div>
  );
}

function FriendRow({ f, t }) {
  const steps = [
    { done: f.verified, label: t("invite.stepVerified") },
    { done: f.reads_done, label: t("invite.stepRead") },
    { done: f.recharged, label: t("invite.stepRecharged") },
  ];
  const name = f.display_name || f.username;

  return (
    <div className="card" style={{ padding: "12px 14px" }}>
      <div className="row between" style={{ gap: 10 }}>
        <div className="row gap-8" style={{ minWidth: 0 }}>
          <Img
            path={f.avatar_url}
            kind="avatar"
            seed={f.username}
            alt=""
            style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </div>
            <div className="muted" style={{ fontSize: 11 }}>{timeAgo(f.joined_at)}</div>
          </div>
        </div>
        <div className="row gap-8" style={{ flexShrink: 0, alignItems: "center" }}>
          <Coins size={14} color="var(--gold)" />
          <span style={{ fontWeight: 800, fontSize: 15 }}>{f.coins_earned}</span>
        </div>
      </div>

      <div className="row gap-8" style={{ marginTop: 10, flexWrap: "wrap" }}>
        {steps.map((s) => (
          <span
            key={s.label}
            style={{
              fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
              display: "inline-flex", alignItems: "center", gap: 4,
              background: s.done ? "var(--indigo-50)" : "var(--bg-subtle, #f4f1ec)",
              color: s.done ? "var(--indigo-600)" : "var(--text-secondary)",
            }}
          >
            {s.done && <Check size={11} />}
            {s.label}
          </span>
        ))}
        {!f.verified && (
          <span className="muted" style={{ fontSize: 11, alignSelf: "center" }}>
            {t("invite.nudgeVerify")}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Invite() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const { data, isLoading } = useMyReferral();
  const sync = useSyncReferral();
  const [copied, setCopied] = useState(false);

  // The visitor may themselves be someone's referee — settle their own
  // milestones on open so a just-earned reward is visible right away.
  useEffect(() => {
    if (user) sync.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const code = data?.referral_code || "";
  const url = referralUrl(data?.share_path);
  const stats = data?.stats || {};
  const p = data?.program || {};
  const friends = data?.friends || [];

  const shareText = t("invite.shareText", { code, url });

  const copy = async (value, msg) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(msg);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t("invite.copyFailed"));
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: t("invite.title"), text: shareText, url });
        return;
      } catch {
        /* user dismissed the sheet — fall through to copy */
      }
    }
    copy(shareText, t("invite.linkCopied"));
  };

  return (
    <div className="app-shell" style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <Seo title={t("invite.title")} robots="noindex, nofollow" />

      <header className="container between" style={{ height: 56 }}>
        <div className="row gap-12">
          <button className="only-mobile" onClick={() => nav(-1)} aria-label={t("common.back")}>
            <ArrowLeft size={22} />
          </button>
          <div className="section-title">{t("invite.title")}</div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: 4, paddingBottom: 48, maxWidth: 680 }}>
        {/* ── code + share ── */}
        <div
          className="card"
          style={{
            padding: "22px 20px", marginBottom: 14, textAlign: "center",
            background: "linear-gradient(150deg, var(--indigo-50), var(--bg-card))",
          }}
        >
          <div className="row gap-8" style={{ justifyContent: "center", color: "var(--text-secondary)", fontSize: 13 }}>
            <UserPlus size={15} /> {t("invite.yourCode")}
          </div>

          {isLoading ? (
            <div style={{ marginTop: 10 }}><SkeletonBox h={40} r={12} /></div>
          ) : (
            <button
              onClick={() => copy(code, t("invite.codeCopied"))}
              aria-label={t("invite.copyCode")}
              style={{
                marginTop: 8, fontWeight: 900, fontSize: 30, letterSpacing: "0.06em",
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "none", border: "none", cursor: "pointer", color: "inherit",
              }}
            >
              {code || "—"}
              {copied ? <Check size={19} color="var(--indigo-600)" /> : <Copy size={17} color="var(--indigo-600)" />}
            </button>
          )}

          <div className="muted" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
            {t("invite.heroSub", { coins: p.referee_welcome_coins ?? 40 })}
          </div>

          <div className="row gap-8" style={{ justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn btn-primary" style={{ minWidth: 170 }} onClick={share}>
              <Share2 size={16} /> {t("invite.share")}
            </button>
            <button className="btn" onClick={() => copy(url, t("invite.linkCopied"))}>
              <Copy size={15} /> {t("invite.copyLink")}
            </button>
          </div>
        </div>

        {/* ── stats ── */}
        <div className="row gap-8" style={{ marginBottom: 18 }}>
          <Stat icon={Users} value={stats.total_invited ?? 0} label={t("invite.statInvited")} />
          <Stat icon={TrendingUp} value={stats.active ?? 0} label={t("invite.statActive")} />
          <Stat icon={Coins} value={stats.coins_earned ?? 0} label={t("invite.statEarned")} />
        </div>

        {/* ── the ladder ── */}
        <div className="section-title" style={{ fontSize: 16, marginBottom: 4 }}>
          {t("invite.howTitle")}
        </div>
        <p className="muted" style={{ fontSize: 12, margin: "0 0 6px", lineHeight: 1.5 }}>
          {t("invite.howSub", { max: p.max_coins_per_referee ?? 670 })}
        </p>

        <div className="card" style={{ padding: "6px 16px", marginBottom: 18 }}>
          <Rung
            icon={MailCheck}
            step={t("invite.rung1Step")}
            title={t("invite.rung1Title")}
            reward={t("invite.rung1Reward", { coins: p.referee_welcome_coins ?? 40 })}
          />
          <Rung
            icon={BookOpen}
            step={t("invite.rung2Step")}
            title={t("invite.rung2Title", { n: p.reads_required ?? 3 })}
            reward={t("invite.rung2Reward", { coins: p.referrer_reads_coins ?? 50 })}
          />
          <Rung
            icon={WalletIcon}
            step={t("invite.rung3Step")}
            title={t("invite.rung3Title")}
            reward={t("invite.rung3Reward", {
              coins: p.referrer_recharge_coins ?? 120,
              percent: p.referee_recharge_bonus_percent ?? 15,
            })}
          />
          <Rung
            icon={TrendingUp}
            step={t("invite.rung4Step")}
            title={t("invite.rung4Title", { days: p.revshare_window_days ?? 90 })}
            reward={t("invite.rung4Reward", {
              percent: p.revshare_percent ?? 5,
              cap: p.revshare_cap_coins ?? 500,
            })}
          />
        </div>

        {/* ── invited friends ── */}
        <div className="section-title" style={{ fontSize: 16, marginBottom: 10 }}>
          {t("invite.friendsTitle")}
        </div>

        {isLoading ? (
          <div style={{ display: "grid", gap: 10 }}>
            {[0, 1].map((i) => <SkeletonBox key={i} h={86} r={14} />)}
          </div>
        ) : friends.length === 0 ? (
          <EmptyState
            icon={<UserPlus size={30} />}
            title={t("invite.emptyTitle")}
            sub={t("invite.emptySub")}
          />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {friends.map((f) => <FriendRow key={f.username} f={f} t={t} />)}
          </div>
        )}

        {/* ── fair-play note ── */}
        <div className="row gap-8" style={{ marginTop: 20, alignItems: "flex-start" }}>
          <ShieldCheck size={14} color="var(--text-secondary)" style={{ marginTop: 2, flexShrink: 0 }} />
          <p className="muted" style={{ fontSize: 11.5, margin: 0, lineHeight: 1.6 }}>
            {t("invite.fairPlay")}
          </p>
        </div>
      </div>
    </div>
  );
}
