import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PenSquare, Eye, Heart, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMyStories } from "../lib/hooks";
import { useAuth } from "../store/auth";
import Img from "../components/Img";
import { SkeletonBox } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import Seo from "../components/Seo";
import { compact } from "../lib/format";

const STATUS_COLORS = {
  published: "badge-green",
  draft: "badge-gold",
  under_review: "badge-blue",
  scheduled: "badge-indigo",
  rejected: "badge-red",
  archived: "badge-red",
  removed: "badge-red",
};

export default function MyStories() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const isCreator = useAuth((s) => s.user?.is_creator);
  const { data, isLoading } = useMyStories(isCreator);
  const items = data?.items || [];

  return (
    <div className="app-shell" style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <Seo title="My Stories" robots="noindex, follow" />
      <header className="container between" style={{ height: 56 }}>
        <div className="row gap-12 only-mobile"><button onClick={() => nav(-1)}><ArrowLeft size={22} /></button><div className="section-title">{t("creator.myStories")}</div></div>
        <div className="only-desktop section-title">{t("creator.myStories")}</div>
        <button className="btn btn-primary btn-sm" onClick={() => nav("/creator/story/new")}><PenSquare size={15} /> {t("creator.newStory")}</button>
      </header>

      <div className="container" style={{ paddingTop: 8, paddingBottom: 40 }}>
        {isLoading ? (
          <div className="poster-grid">{Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} h={220} r={14} />)}</div>
        ) : !items.length ? (
          <EmptyState icon={<PenSquare size={32} />} title={t("common.nothingHere")} sub={t("creator.becomeSub")}
            action={<button className="btn btn-primary" onClick={() => nav("/creator/story/new")}>{t("creator.newStory")}</button>} />
        ) : (
          <div className="poster-grid">
            {items.map((st) => (
              <Link key={st.id} to={`/story/${st.slug}`} className="card" style={{ overflow: "hidden" }}>
                <div style={{ position: "relative", aspectRatio: "0.7" }}>
                  <Img path={st.thumbnail_url} seed={st.id} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span className={`badge ${STATUS_COLORS[st.status] || "badge-indigo"}`} style={{ position: "absolute", top: 8, left: 8 }}>
                    {st.status ? t(`status.${st.status}`, { defaultValue: st.status.replace(/_/g, " ") }) : ""}
                  </span>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav(`/creator/story/${st.id}/edit`); }}
                    aria-label={t("common.edit")}
                    style={{
                      position: "absolute", top: 8, right: 8, display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "5px 9px", borderRadius: 999, border: "none", cursor: "pointer",
                      background: "rgba(10,6,4,.62)", color: "#fff", fontSize: 11.5, fontWeight: 700,
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <Pencil size={12} /> {t("common.edit")}
                  </button>
                </div>
                <div style={{ padding: 10 }}>
                  <div className="clamp-1" style={{ fontWeight: 600, fontSize: 13.5 }}>{st.title}</div>
                  <div className="row gap-10 tertiary" style={{ fontSize: 11.5, marginTop: 5 }}>
                    <span className="row gap-4"><Eye size={12} /> {compact(st.total_views)}</span>
                    <span className="row gap-4"><Heart size={12} /> {compact(st.total_likes)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
