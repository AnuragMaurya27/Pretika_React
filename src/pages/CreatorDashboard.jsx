import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Eye, Heart, MessageCircle, Users, BookOpen, Layers,
  PenSquare, ChevronRight, Trophy, Star, Library, UserRound, Pencil,
} from "lucide-react";
import { RankIcon } from "../components/Art";
import { useTranslation } from "react-i18next";
import { useCreatorStats, useMyStories } from "../lib/hooks";
import { useAuth } from "../store/auth";
import { SkeletonBox } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import Img from "../components/Img";
import { compact } from "../lib/format";
import Seo from "../components/Seo";

const STATUS_BADGE = {
  published: "badge-green",
  draft: "badge-gold",
  under_review: "badge-blue",
  scheduled: "badge-indigo",
  rejected: "badge-red",
  archived: "badge-red",
  removed: "badge-red",
};

export default function CreatorDashboard() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const isCreator = user?.is_creator;
  const { data: s, isLoading } = useCreatorStats(isCreator);
  const myStories = useMyStories(isCreator);

  if (!isCreator) {
    return (
      <div className="app-shell">
        <div className="page-scroll" style={{ display: "grid", placeItems: "center", minHeight: "70dvh" }}>
          <div className="center container" style={{ maxWidth: 420 }}>
            <div style={{ display: "grid", placeItems: "center" }}><PenSquare size={46} color="var(--crimson)" /></div>
            <div className="display" style={{ fontSize: 22, fontWeight: 800, marginTop: 12 }}>{t("creator.becomeTitle")}</div>
            <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>{t("creator.needCreator")}</p>
            <Link to="/become-creator" className="btn btn-primary btn-block mt-24">{t("creator.becomeTitle")}</Link>
          </div>
        </div>
      </div>
    );
  }

  const stories = myStories.data?.items || [];
  const name = user?.display_name || user?.username;

  return (
    <div className="app-shell" style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <Seo title="Creator Dashboard" robots="noindex, follow" />
      <header className="container only-mobile row gap-12" style={{ height: 56 }}>
        <button onClick={() => nav(-1)}><ArrowLeft size={22} /></button>
        <div className="section-title">{t("creator.dashboard")}</div>
      </header>

      <div className="container" style={{ paddingTop: 12, paddingBottom: 48, maxWidth: 1080 }}>
        {isLoading ? (
          <div style={{ display: "grid", gap: 14 }}>
            <SkeletonBox h={150} r={20} /><SkeletonBox h={110} r={16} /><SkeletonBox h={180} r={16} />
          </div>
        ) : (
          <>
            {/* ═══ Hero — greeting + rank + primary CTA ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="cd-hero"
            >
              <div className="aurora" style={{ opacity: 0.35 }} />
              <div className="fog" style={{ opacity: 0.35 }} />
              <div className="cd-hero-in">
                <div className="row gap-12" style={{ minWidth: 0, flex: 1 }}>
                  <Img path={user?.avatar_url} seed={user?.username} kind="avatar" alt=""
                    style={{ width: 58, height: 58, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(255,255,255,.3)", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.65)" }}>{t("creator.hello")}</div>
                    <div className="serif clamp-1" style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{name}</div>
                    <div className="row gap-6" style={{ marginTop: 5, flexWrap: "wrap" }}>
                      <span className="sd-badge crimson" style={{ textTransform: "none", letterSpacing: 0 }}>
                        <RankIcon rank={s?.fear_rank} size={13} color="#ffd9b0" />
                        {t(`ranks.${s?.fear_rank}`, { defaultValue: s?.fear_rank || "—" })}
                      </span>
                      <span className="sd-badge" style={{ textTransform: "none", letterSpacing: 0 }}>Lv {s?.fear_rank_level ?? 1}</span>
                    </div>
                  </div>
                </div>
                <div className="row gap-8 cd-hero-cta">
                  <button className="sd-start" style={{ height: 46, fontSize: 14.5 }} onClick={() => nav("/creator/story/new")}>
                    <PenSquare size={17} /> {t("creator.newStory")}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ═══ Overview stats ═══ */}
            <div className="eyebrow" style={{ margin: "22px 0 10px" }}>{t("creator.overview")}</div>
            <div className="cd-stats">
              <StatCard icon={<Eye size={18} />} n={s?.total_views} label={t("creator.statViews")} i={0} />
              <StatCard icon={<Heart size={18} />} n={s?.total_likes} label={t("creator.statLikes")} i={1} />
              <StatCard icon={<MessageCircle size={18} />} n={s?.total_comments} label={t("creator.statComments")} i={2} />
              <StatCard icon={<Users size={18} />} n={s?.followers_count} label={t("creator.statFollowers")} i={3} />
              <StatCard icon={<BookOpen size={18} />} n={s?.published_stories_count} label={t("creator.statStories")} i={4} />
              <StatCard icon={<Layers size={18} />} n={s?.total_episodes_count} label={t("creator.statEpisodes")} i={5} />
            </div>

            <div className="cd-grid">
              <div>
                {/* ═══ Rank progress ═══ */}
                <div className="card" style={{ padding: 16, marginTop: 14 }}>
                  <div className="between">
                    <div className="row gap-10">
                      <div style={{ width: 46, height: 46, borderRadius: 12, display: "grid", placeItems: "center", background: "var(--indigo-50)", border: "1px solid var(--indigo-100)" }}>
                        <RankIcon rank={s?.fear_rank} size={26} color="var(--crimson)" />
                      </div>
                      <div>
                        <div className="tertiary" style={{ fontSize: 11 }}>{t("creator.creatorRank")}</div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{t(`ranks.${s?.fear_rank}`, { defaultValue: s?.fear_rank })}</div>
                      </div>
                    </div>
                    <div className="badge badge-indigo">Lv {s?.fear_rank_level ?? 1}</div>
                  </div>
                  <div style={{ marginTop: 12, height: 8, background: "var(--bg-tertiary)", borderRadius: 8, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (s?.milestone_progress ?? 0) * 100)}%` }} transition={{ duration: 0.8 }}
                      style={{ height: "100%", background: "linear-gradient(90deg,var(--indigo-800),var(--indigo-400))", borderRadius: 8 }} />
                  </div>
                  <div className="between tertiary" style={{ fontSize: 11, marginTop: 6 }}>
                    <span>{compact(s?.fear_score ?? 0)} score</span>
                    {s?.next_rank_name && <span>{t("creator.nextRank")}: {t(`ranks.${s.next_rank_name}`, { defaultValue: s.next_rank_name })}</span>}
                  </div>
                </div>

                {/* ═══ Top story ═══ */}
                {s?.top_story?.id && (
                  <Link to={`/story/${s.top_story.slug || s.top_story.id}`} className="card row gap-12 hover-lift" style={{ padding: 12, marginTop: 14 }}>
                    <Img path={s.top_story.thumbnail_url} seed={s.top_story.id} style={{ width: 50, height: 72, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="tertiary row gap-4" style={{ fontSize: 11 }}><Trophy size={12} color="var(--gold)" /> {t("creator.topStory")}</div>
                      <div className="clamp-1" style={{ fontWeight: 700 }}>{s.top_story.title}</div>
                      <div className="tertiary" style={{ fontSize: 11.5 }}>{compact(s.top_story.views)} {t("common.views")} · {compact(s.top_story.likes)} {t("common.likes")}</div>
                    </div>
                    <ChevronRight size={18} className="tertiary" />
                  </Link>
                )}

                {/* ═══ Quick actions ═══ */}
                <div className="eyebrow" style={{ margin: "22px 0 10px" }}>{t("creator.quickActions")}</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <Action icon={<PenSquare size={19} />} title={t("creator.newStory")} sub={t("creator.newStorySub")} onClick={() => nav("/creator/story/new")} primary />
                  <Action icon={<Library size={19} />} title={t("creator.myStories")} sub={t("creator.manageSub")} onClick={() => nav("/creator/stories")} />
                  {user?.username && (
                    <Action icon={<UserRound size={19} />} title={t("creator.viewPublic")} sub={t("creator.publicSub")} onClick={() => nav(`/u/${user.username}`)} />
                  )}
                  <Action icon={<Pencil size={19} />} title={t("creator.editProfile")} sub={`@${user?.username}`} onClick={() => nav("/profile/edit")} />
                </div>
              </div>

              {/* ═══ Story performance ═══ */}
              <div>
                <div className="between" style={{ margin: "22px 0 10px" }}>
                  <div className="eyebrow">{t("creator.performance")}</div>
                  <Link to="/creator/stories" className="see-all">{t("common.seeAll")} <ChevronRight size={15} /></Link>
                </div>
                {myStories.isLoading ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} h={78} r={14} />)}
                  </div>
                ) : stories.length === 0 ? (
                  <EmptyState icon={<PenSquare size={32} />} title={t("creator.noStoriesYet")}
                    action={<button className="btn btn-primary" onClick={() => nav("/creator/story/new")}>{t("creator.writeFirst")}</button>} />
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {stories.slice(0, 8).map((st, i) => (
                      <motion.div key={st.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Link to={`/story/${st.slug}`} className="card row gap-12 cd-story" style={{ padding: 10 }}>
                          <Img path={st.thumbnail_url} seed={st.id} style={{ width: 46, height: 66, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="row gap-8" style={{ minWidth: 0 }}>
                              <span className="clamp-1" style={{ fontWeight: 700, fontSize: 14 }}>{st.title}</span>
                              <span className={`badge ${STATUS_BADGE[st.status] || "badge-indigo"}`} style={{ textTransform: "capitalize", flexShrink: 0 }}>
                                {(st.status || "").replace(/_/g, " ")}
                              </span>
                            </div>
                            <div className="row gap-12 tertiary" style={{ fontSize: 11.5, marginTop: 6, flexWrap: "wrap" }}>
                              <span className="row gap-4"><Eye size={12} /> {compact(st.total_views)}</span>
                              <span className="row gap-4"><Heart size={12} /> {compact(st.total_likes)}</span>
                              <span className="row gap-4"><MessageCircle size={12} /> {compact(st.total_comments)}</span>
                              {st.average_rating > 0 && (
                                <span className="row gap-4"><Star size={12} fill="var(--gold)" color="var(--gold)" /> {st.average_rating.toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={17} className="tertiary" style={{ flexShrink: 0 }} />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const StatCard = ({ icon, n, label, i = 0 }) => (
  <motion.div
    className="card"
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(i * 0.05, 0.35), duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    style={{ padding: 14 }}
  >
    <div style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", background: "var(--indigo-50)", color: "var(--indigo-600)" }}>{icon}</div>
    <div style={{ fontWeight: 800, fontSize: 21, marginTop: 8 }}>{compact(n ?? 0)}</div>
    <div className="tertiary" style={{ fontSize: 11.5 }}>{label}</div>
  </motion.div>
);

function Action({ icon, title, sub, onClick, primary }) {
  return (
    <button onClick={onClick} className="card cd-action row gap-12" style={{ padding: 14, width: "100%", textAlign: "left", ...(primary ? { borderColor: "var(--indigo-200)" } : {}) }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, display: "grid", placeItems: "center", flexShrink: 0,
        background: primary ? "var(--indigo-600)" : "var(--indigo-50)",
        color: primary ? "#fff" : "var(--indigo-600)",
        boxShadow: primary ? "0 8px 20px -6px rgba(156,28,20,.5)" : "none",
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
        <div className="tertiary clamp-1" style={{ fontSize: 12 }}>{sub}</div>
      </div>
      <ChevronRight size={17} className="tertiary" style={{ flexShrink: 0 }} />
    </button>
  );
}
