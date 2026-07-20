import { Link } from "react-router-dom";
import { Gift, Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTopGifters } from "../lib/wallet";
import Img from "./Img";

/**
 * "Top Gifters" list on the story page (spec 3.2/4.3 — social status drives
 * gifting). Renders nothing until the story has at least one gift.
 */
export default function TopGifters({ storyId }) {
  const { t } = useTranslation();
  const { data } = useTopGifters(storyId);
  const gifters = data || [];
  if (gifters.length === 0) return null;

  return (
    <div className="sd-card" style={{ marginTop: 14 }}>
      <div className="eyebrow row gap-8" style={{ marginBottom: 12 }}>
        <Gift size={13} /> {t("gift.topGifters")}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {gifters.map((g, i) => (
          <Link key={g.user_id} to={`/u/${g.username}`} className="row between" style={{ gap: 10 }}>
            <div className="row gap-10" style={{ minWidth: 0 }}>
              <span
                style={{
                  width: 22, textAlign: "center", fontWeight: 800, fontSize: 13, flexShrink: 0,
                  color: i === 0 ? "var(--gold)" : "var(--text-tertiary)",
                }}
              >
                {i + 1}
              </span>
              <Img
                path={g.avatar_url} seed={g.username} kind="avatar" alt=""
                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
              <span className="clamp-1" style={{ fontWeight: 650, fontSize: 13.5 }}>
                {g.display_name || g.username}
              </span>
            </div>
            <span className="row gap-4" style={{ fontWeight: 800, fontSize: 13, color: "var(--gold)", flexShrink: 0 }}>
              <Coins size={13} /> {g.total_coins}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
