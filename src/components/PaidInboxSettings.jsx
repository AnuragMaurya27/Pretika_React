import { useState } from "react";
import { Lock, Coins, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useDmSettings, useUpdateDmSettings } from "../lib/chat";
import { errMsg } from "../lib/api";

// Creator setting: charge non-followers coins to DM you (held in escrow, refunded
// if you don't reply in time). Unlocks at a follower threshold from the server.
export default function PaidInboxSettings() {
  const { data, isLoading } = useDmSettings();
  if (isLoading || !data) return null;
  // Re-key on the server values so the form initialises fresh (no sync effect).
  return <PaidInboxForm key={`${data.paid_inbox_enabled}:${data.dm_price_coins}`} data={data} />;
}

function PaidInboxForm({ data }) {
  const { t } = useTranslation();
  const update = useUpdateDmSettings();
  const step = data.price_step || 20;
  const max = data.max_coins || 620;

  const [enabled, setEnabled] = useState(!!data.paid_inbox_enabled);
  const [price, setPrice] = useState(data.dm_price_coins || step);

  const eligible = !!data.eligible;
  const followers = data.total_followers || 0;
  const need = data.min_followers || 1000;

  const clampPrice = (v) => Math.max(step, Math.min(max, Math.round(v / step) * step));
  const save = () => {
    update.mutate(
      { enabled, price_coins: enabled ? clampPrice(price) : 0 },
      {
        onSuccess: () => toast.success(t("chat.paidInboxSaved")),
        onError: (e) => toast.error(errMsg(e)),
      },
    );
  };

  return (
    <section className="ep-sec">
      <div className="ep-sec-title"><Lock size={16} /> {t("chat.paidInbox")}</div>
      <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.55, marginTop: -4, marginBottom: 12 }}>
        {t("chat.paidInboxSub")}
      </p>

      {!eligible ? (
        <div className="pi-locked">
          <span>{t("chat.paidInboxLocked", { need })}</span>
          <div className="pi-bar"><i style={{ width: `${Math.min(100, (followers / need) * 100)}%` }} /></div>
          <span className="tertiary" style={{ fontSize: 11.5 }}>{followers} / {need} {t("common.followers")}</span>
        </div>
      ) : (
        <>
          <label className="pi-toggle">
            <span style={{ fontWeight: 600, fontSize: 14 }}>{t("chat.paidInboxEnable")}</span>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span className="pi-switch" aria-hidden />
          </label>

          {enabled && (
            <div style={{ marginTop: 12 }}>
              <div className="field-label">{t("chat.paidInboxPrice")}</div>
              <div className="pi-price">
                <button type="button" onClick={() => setPrice((p) => clampPrice(p - step))} aria-label="-">−</button>
                <span className="pi-price-val"><Coins size={16} color="var(--gold)" /> {clampPrice(price)}</span>
                <button type="button" onClick={() => setPrice((p) => clampPrice(p + step))} aria-label="+">+</button>
              </div>
              <div className="tertiary" style={{ fontSize: 11.5, marginTop: 6 }}>
                {t("chat.paidInboxHint", { step, max })}
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={save} disabled={update.isPending}>
            {update.isPending ? <><Loader2 size={15} className="spin" /> {t("common.saving")}</> : <><Check size={15} /> {t("common.save")}</>}
          </button>
        </>
      )}
    </section>
  );
}
