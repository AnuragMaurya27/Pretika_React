import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Heart, Bookmark, Share2, Eye, Star,
  Play, BadgeCheck, Layers, BookOpen, Clock, Flag, Lock, Gift, Coins,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  useStoryDetail, useLikeStory, useBookmarkStory,
  useRateStory, useUserProfile, useFollow,
} from "../lib/hooks";
import { PageLoader } from "../components/Art";
import EmptyState, { ErrorState } from "../components/EmptyState";
import Img from "../components/Img";
import Tilt from "../components/Tilt";
import Seo from "../components/Seo";
import StarRating from "../components/StarRating";
import CommentSection from "../components/CommentSection";
import ReportSheet from "../components/ReportSheet";
import UnlockSheet from "../components/UnlockSheet";
import GiftTray from "../components/GiftTray";
import TopGifters from "../components/TopGifters";
import { useAuth } from "../store/auth";
import { compact } from "../lib/format";
import { getProgress } from "../lib/reading";
import { thumbFor } from "../lib/constants";
import { errMsg } from "../lib/api";
import { categoryLabel } from "../lib/categories";

export default function StoryDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();
  const authed = useAuth((s) => s.isAuthed)();
  const me = useAuth((s) => s.user);
  const { data: story, isLoading, isError, refetch } = useStoryDetail(slug);

  const like = useLikeStory();
  const bookmark = useBookmarkStory();
  const rate = useRateStory(slug);
  const follow = useFollow();
  const [tab, setTab] = useState("episodes");
  const [reportOpen, setReportOpen] = useState(false);
  const [unlockEp, setUnlockEp] = useState(null);
  const [giftOpen, setGiftOpen] = useState(false);

  // creator follow status (story payload doesn't include it). useFollow keeps
  // the cached profile's is_following in sync optimistically — no local override.
  const isOwn = !!me && me.id === story?.creator_id;
  const creatorProfile = useUserProfile(story?.creator_username, authed && !!story && !isOwn);
  const isFollowing = creatorProfile.data?.is_following ?? false;

  if (isLoading) return <div className="app-shell"><PageLoader minHeight="80dvh" /></div>;
  if (isError || !story) return <div className="app-shell"><ErrorState onRetry={refetch} /></div>;

  const requireAuth = () => {
    if (!authed) { toast.error(t("toast.loginRequired")); nav("/login"); return false; }
    return true;
  };

  const toggleLike = () => {
    if (!requireAuth()) return;
    like.mutate({ id: story.id, liked: story.is_liked }, {
      onSuccess: () => toast.success(story.is_liked ? t("toast.unliked") : t("toast.liked")),
      onError: (e) => toast.error(errMsg(e)),
    });
  };
  const toggleSave = () => {
    if (!requireAuth()) return;
    bookmark.mutate({ id: story.id, saved: story.is_bookmarked }, {
      onSuccess: () => toast.success(story.is_bookmarked ? t("toast.unsaved") : t("toast.saved")),
      onError: (e) => toast.error(errMsg(e)),
    });
  };
  const toggleFollow = () => {
    if (!requireAuth()) return;
    if (follow.isPending) return;
    follow.mutate({ id: story.creator_id, following: isFollowing }, {
      onError: (e) => toast.error(errMsg(e)),
    });
  };
  const rateStory = (n) => {
    if (!requireAuth()) return;
    rate.mutate({ id: story.id, rating: n }, {
      onSuccess: () => toast.success(t("reader.rateThanks")),
      onError: (e) => toast.error(errMsg(e)),
    });
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: story.title, url });
      else { await navigator.clipboard.writeText(url); toast.success(t("toast.linkCopied")); }
    } catch { /* cancelled */ }
  };

  // Locked chapter → unlock sheet (spec 4.2); everything else reads directly.
  const epLocked = (ep) => ep.access_type === "premium" && !ep.is_unlocked && !isOwn;
  const openEpisode = (ep) => {
    if (epLocked(ep)) {
      if (!requireAuth()) return;
      setUnlockEp(ep);
      return;
    }
    nav(`/read/${story.id}/${ep.id}`);
  };

  const episodes = story.episodes || [];
  const firstEp = episodes[0];
  // resume from local reading progress if present
  const progress = getProgress(story.id);
  const resumeEp = progress?.episode_id && episodes.find((e) => e.id === progress.episode_id);
  const startEp = resumeEp || firstEp;
  const resumePct = resumeEp ? Math.max(0, Math.min(100, Math.round(progress?.scroll_percentage || 0))) : 0;

  const totalMins = Math.max(1, Math.round(episodes.reduce((s, e) => s + (e.estimated_read_time_seconds || 0), 0) / 60));

  const seoImg = thumbFor(story.thumbnail_url, story.id);
  const seoDesc = (story.summary || `${story.title} — read this spine-chilling Hindi horror story on Pretika.`).slice(0, 160);

  return (
    <div className="app-shell" style={{ background: "var(--bg)" }}>
      <Seo
        title={story.title}
        description={seoDesc}
        image={seoImg}
        path={`/story/${slug}`}
        type="article"
        keywords={[story.title, story.category_name, ...(story.tags || []), "hindi horror story", "डरावनी कहानी"].filter(Boolean).join(", ")}
        publishedTime={story.published_at || story.created_at}
        modifiedTime={story.updated_at}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "@id": `https://pretika.in/story/${slug}`,
            mainEntityOfPage: { "@type": "WebPage", "@id": `https://pretika.in/story/${slug}` },
            name: story.title,
            headline: story.title,
            description: seoDesc,
            image: seoImg,
            url: `https://pretika.in/story/${slug}`,
            inLanguage: "hi",
            genre: story.category_name || "Horror",
            keywords: (story.tags || []).join(", ") || undefined,
            isAccessibleForFree: true,
            datePublished: story.published_at || story.created_at,
            dateModified: story.updated_at || story.published_at || story.created_at,
            author: {
              "@type": "Person",
              name: story.creator_display_name || story.creator_username,
              url: `https://pretika.in/u/${story.creator_username}`,
            },
            publisher: {
              "@type": "Organization",
              name: "Pretika",
              url: "https://pretika.in",
              logo: { "@type": "ImageObject", "url": "https://pretika.in/favicon.svg" },
            },
            aggregateRating: story.average_rating > 0 ? {
              "@type": "AggregateRating",
              ratingValue: story.average_rating.toFixed(1),
              ratingCount: story.rating_count || 1,
              bestRating: 5,
            } : undefined,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://pretika.in/home" },
              { "@type": "ListItem", position: 2, name: story.category_name || "Stories", item: "https://pretika.in/explore" },
              { "@type": "ListItem", position: 3, name: story.title, item: `https://pretika.in/story/${slug}` },
            ],
          },
        ]}
      />

      {/* ═══ CINEMATIC HERO — blurred cover world, poster + everything key ═══ */}
      <div className="sd-hero">
        <Img path={story.thumbnail_url} seed={story.id} alt="" loading="eager" className="sd-hero-bg ken-burns" />
        <div className="sd-hero-wash" />
        <div className="fog" style={{ opacity: 0.45 }} />

        {/* floating chrome */}
        <button onClick={() => nav(-1)} className="sd-glass-ic" style={floatBtn(14, 14)} aria-label={t("common.back")}><ArrowLeft size={20} /></button>
        <button onClick={share} className="sd-glass-ic" style={floatBtn(14, null, 14)} aria-label={t("story.share")}><Share2 size={18} /></button>

        <div className="container sd-hero-grid">
          {/* poster */}
          <motion.div
            className="scene-3d"
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Tilt max={9} scale={1.03} className="sd-poster">
              <Img path={story.thumbnail_url} seed={story.id} alt={story.title} loading="eager"
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Tilt>
          </motion.div>

          {/* info */}
          <div className="sd-info">
            <motion.div
              className="row gap-8"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              style={{ flexWrap: "wrap" }}
            >
              {story.category_name && <span className="sd-badge crimson">{categoryLabel(story.category_name)}</span>}
              <span className="sd-badge">
                {story.story_type === "series"
                  ? <><Layers size={12} /> {episodes.length} {t("common.episodes")}</>
                  : <><BookOpen size={12} /> {t("creator.single")}</>}
              </span>
              {story.is_editor_pick && <span className="sd-badge gold"><Star size={12} fill="currentColor" /> {t("story.editorsPick")}</span>}
            </motion.div>

            <motion.h1
              className="serif sd-title"
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.18, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginTop: 14 }}
            >
              {story.title}
            </motion.h1>

            {/* creator + follow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.55 }}
              className="row gap-12"
              style={{ marginTop: 16, flexWrap: "wrap" }}
            >
              <Link to={`/u/${story.creator_username}`} className="row gap-8">
                <Img path={story.creator_avatar_url} seed={story.creator_username} kind="avatar" alt=""
                  style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,.3)" }} />
                <div style={{ textAlign: "left" }}>
                  <div className="row gap-4" style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
                    {story.creator_display_name || story.creator_username}
                    {story.is_verified_creator && <BadgeCheck size={14} color="#7db6ff" />}
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)" }}>@{story.creator_username}</div>
                </div>
              </Link>
              {!isOwn && (
                <button
                  onClick={toggleFollow}
                  className="btn btn-sm"
                  style={isFollowing
                    ? { background: "rgba(255,255,255,.14)", color: "#fff", border: "1px solid rgba(255,255,255,.25)" }
                    : { background: "#fff", color: "var(--crimson-dark)" }}
                >
                  {isFollowing ? t("story.following") : t("story.follow")}
                </button>
              )}
            </motion.div>

            {/* stats */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }}
              className="row gap-16"
              style={{ marginTop: 18, flexWrap: "wrap" }}
            >
              <span className="sd-stat"><Eye size={15} /> {compact(story.total_views)} {t("common.views")}</span>
              <span className="sd-stat"><Heart size={15} /> {compact(story.total_likes)}</span>
              {story.average_rating > 0 && (
                <span className="sd-stat"><Star size={15} fill="var(--gold)" color="var(--gold)" /> {story.average_rating.toFixed(1)} ({compact(story.rating_count || 0)})</span>
              )}
              <span className="sd-stat"><Clock size={15} /> {totalMins} {t("story.readTime")}</span>
            </motion.div>

            {/* actions */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="row gap-10"
              style={{ marginTop: 22, flexWrap: "wrap" }}
            >
              <button className="sd-start" onClick={() => startEp && openEpisode(startEp)} disabled={!startEp}>
                <Play size={18} fill="#fff" />
                {resumeEp
                  ? `${t("story.continue")} · EP ${resumeEp.episode_number}`
                  : t("story.start")}
              </button>
              <div className="row gap-8">
                <button className={`sd-glass-ic ${story.is_liked ? "on" : ""}`} onClick={toggleLike} aria-label={t("story.like")}>
                  <Heart size={19} fill={story.is_liked ? "#fff" : "none"} />
                </button>
                <button className={`sd-glass-ic ${story.is_bookmarked ? "on" : ""}`} onClick={toggleSave} aria-label={t("story.bookmark")}>
                  <Bookmark size={19} fill={story.is_bookmarked ? "#fff" : "none"} />
                </button>
                {!isOwn && story.creator_monetized && (
                  <button
                    className="sd-glass-ic"
                    onClick={() => { if (requireAuth()) setGiftOpen(true); }}
                    aria-label={t("gift.title")}
                    title={t("gift.title")}
                  >
                    <Gift size={19} />
                  </button>
                )}
                {!isOwn && (
                  <button
                    className="sd-glass-ic"
                    onClick={() => { if (requireAuth()) setReportOpen(true); }}
                    aria-label={t("story.reportStory")}
                    title={t("story.reportStory")}
                  >
                    <Flag size={19} />
                  </button>
                )}
              </div>
            </motion.div>

            {/* resume progress */}
            {resumeEp && resumePct > 0 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                style={{ marginTop: 14, maxWidth: 380, width: "100%" }}
              >
                <div className="sd-resume-bar">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${resumePct}%` }}
                    transition={{ delay: 0.7, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, var(--crimson-mid), #ff6a55)" }}
                  />
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)", marginTop: 6 }}>
                  {resumePct}% · {progress?.episode_title || `${t("story.episode")} ${resumeEp.episode_number}`}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BODY — summary, tags, rating, tabs ═══ */}
      <div className="container sd-body" style={{ paddingTop: 26, paddingBottom: 40 }}>
        {/* Summary */}
        {story.summary && (
          <motion.div
            className="sd-card"
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="eyebrow" style={{ marginBottom: 8 }}>{t("story.about")}</div>
            <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.85 }}>{story.summary}</p>
            {story.tags?.length > 0 && (
              <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: "wrap" }}>
                {story.tags.map((tg) => <span key={tg} className="chip" style={{ height: 30, fontSize: 12 }}>#{tg}</span>)}
              </div>
            )}
          </motion.div>
        )}

        {/* Rate this story */}
        <motion.div
          className="sd-card"
          initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginTop: 14 }}
        >
          <div className="between" style={{ flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{t("story.rate")}</div>
              <div className="tertiary" style={{ fontSize: 12, marginTop: 3 }}>
                {story.my_rating
                  ? <span className="row gap-4" style={{ display: "inline-flex" }}>{t("story.yourRating")}: {story.my_rating} <Star size={11} fill="var(--gold)" color="var(--gold)" /></span>
                  : t("story.ratingsCount", { n: compact(story.rating_count || 0) })}
              </div>
            </div>
            <StarRating value={story.my_rating || 0} onRate={rateStory} size={28} disabled={rate.isPending} />
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="row gap-8" style={{ marginTop: 26, borderBottom: "1px solid var(--border-solid)" }}>
          <Tab active={tab === "episodes"} onClick={() => setTab("episodes")}>{t("story.episodes")} ({episodes.length})</Tab>
          <Tab active={tab === "comments"} onClick={() => setTab("comments")}>
            {t("story.comments")}{story.total_comments > 0 ? ` (${compact(story.total_comments)})` : ""}
          </Tab>
        </div>

        {tab === "episodes" ? (
          <div style={{ paddingTop: 10 }}>
            {episodes.length === 0 && <EmptyState icon={<BookOpen size={32} />} sub={t("common.nothingHere")} />}
            {episodes.map((ep, i) => (
              <EpisodeRow
                key={ep.id} ep={ep} index={i}
                locked={epLocked(ep)}
                isResume={resumeEp && ep.id === resumeEp.id}
                resumePct={resumePct}
                onOpen={() => openEpisode(ep)}
              />
            ))}
          </div>
        ) : (
          <CommentSection storyId={story.id} creatorId={story.creator_id} episodes={episodes} />
        )}

        {/* Top Gifters — social proof for the gift economy (spec 4.3) */}
        <TopGifters storyId={story.id} />
      </div>

      {/* report story — portal sheet (Layout's transition filter traps fixed) */}
      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        entityType="story"
        entityId={story.id}
      />

      {/* chapter unlock (spec 4.2) — after unlock, straight into the reader */}
      <UnlockSheet
        open={!!unlockEp}
        episode={unlockEp}
        onClose={() => setUnlockEp(null)}
        onUnlocked={(ep) => nav(`/read/${story.id}/${ep.id}`)}
      />

      {/* gift tray (spec 4.3) */}
      <GiftTray
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        creatorId={story.creator_id}
        storyId={story.id}
        creatorName={story.creator_display_name || story.creator_username}
      />
    </div>
  );
}

function EpisodeRow({ ep, index, onOpen, isResume, resumePct, locked }) {
  const { t } = useTranslation();
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ delay: Math.min(index * 0.04, 0.35), duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onClick={onOpen}
      className="between ep-row"
      style={{
        width: "100%", textAlign: "left", padding: "13px 14px",
        ...(isResume ? { background: "var(--indigo-50)", border: "1px solid var(--indigo-100)", borderRadius: 12 } : {}),
      }}
    >
      <div className="row gap-12" style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center",
          fontWeight: 800, fontSize: 13, flexShrink: 0,
          background: isResume ? "var(--indigo-600)" : "var(--indigo-50)",
          color: isResume ? "#fff" : "var(--indigo-800)",
        }}>
          {locked ? <Lock size={14} /> : ep.episode_number}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="clamp-1" style={{ fontWeight: 650, fontSize: 14 }}>{ep.title}</div>
          <div className="row gap-8 tertiary" style={{ fontSize: 11.5, marginTop: 2 }}>
            <span>{Math.max(1, Math.round((ep.estimated_read_time_seconds || 0) / 60))} {t("story.readTime")}</span>
            <span>· {compact(ep.total_views)} {t("common.views")}</span>
            {locked && (
              <span className="row gap-4" style={{ color: "var(--gold)", fontWeight: 800 }}>
                · <Coins size={11} /> {ep.unlock_coin_cost} {t("wallet.coins")}
              </span>
            )}
            {isResume && resumePct > 0 && <span style={{ color: "var(--crimson)", fontWeight: 700 }}>· {resumePct}%</span>}
          </div>
          {isResume && resumePct > 0 && (
            <div style={{ marginTop: 7, height: 4, maxWidth: 220, background: "var(--bg-tertiary)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${resumePct}%`, height: "100%", background: "linear-gradient(90deg, var(--crimson-mid), var(--crimson))", borderRadius: 4 }} />
            </div>
          )}
        </div>
      </div>
      <span className="ep-play" style={{
        ...epPlay,
        ...(isResume ? { background: "var(--crimson)", color: "#fff" } : {}),
        ...(locked ? { background: "var(--indigo-50)", color: "var(--indigo-600)" } : {}),
      }}>
        {locked ? <Lock size={14} /> : <Play size={14} fill="currentColor" />}
      </span>
    </motion.button>
  );
}

const epPlay = {
  width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center",
  background: "var(--bg-secondary)", color: "var(--text-tertiary)", flexShrink: 0,
};

const Tab = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    position: "relative", padding: "10px 4px", fontWeight: 700, fontSize: 14,
    color: active ? "var(--indigo-600)" : "var(--text-tertiary)",
    marginBottom: -1, transition: "color .2s ease",
  }}>
    {children}
    {active && (
      <motion.span
        layoutId="detail-tab"
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 2.5, borderRadius: 2,
          background: "var(--indigo-600)", boxShadow: "0 0 10px rgba(156,28,20,.4)",
        }}
      />
    )}
  </button>
);

const floatBtn = (top, left, right) => ({
  position: "absolute", top, left: left ?? "auto", right: right ?? "auto", zIndex: 6,
  width: 42, height: 42, borderRadius: "50%",
});
