import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Share2, BookOpen, Users, Eye, PenLine, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useUserProfile, useCreatorStories, useFollow } from "../lib/hooks";
import { useStartChat } from "../lib/chat";
import { StoryCard } from "../components/StoryCard";
import { SkeletonBox } from "../components/Skeleton";
import EmptyState, { ErrorState } from "../components/EmptyState";
import FollowListSheet from "../components/FollowListSheet";
import Img from "../components/Img";
import ProfileCover from "../components/ProfileCover";
import Seo from "../components/Seo";
import { useAuth } from "../store/auth";
import { compact } from "../lib/format";
import { thumbFor } from "../lib/constants";
import { errMsg } from "../lib/api";

export default function CreatorProfile() {
  const { username } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();
  const authed = useAuth((s) => s.isAuthed)();
  const me = useAuth((s) => s.user);

  const { data: u, isLoading, isError, refetch } = useUserProfile(username);
  const stories = useCreatorStories(u?.id, !!u?.id);
  const follow = useFollow();
  const startChat = useStartChat();

  const [followSheet, setFollowSheet] = useState(null); // null | "followers" | "following"
  // useFollow flips is_following in the react-query cache optimistically, so
  // read it straight from the profile — no local override to fall out of sync.
  const isFollowing = u?.is_following ?? false;
  const isSelf = !!me && (me.id === u?.id || me.username === u?.username);

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !u) return <div className="app-shell"><ErrorState onRetry={refetch} /></div>;

  const toggleFollow = () => {
    if (!authed) { toast.error(t("toast.loginRequired")); nav("/login"); return; }
    if (follow.isPending) return;
    follow.mutate({ id: u.id, following: isFollowing }, {
      onError: (e) => toast.error(errMsg(e)),
    });
  };
  const onMessage = () => {
    if (!authed) { toast.error(t("toast.loginRequired")); nav("/login"); return; }
    if (startChat.isPending) return;
    startChat.mutate(u.id, {
      onSuccess: (room) => nav(`/chat/${room.id}`),
      onError: (e) => toast.error(errMsg(e)),
    });
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: u.display_name || u.username, url });
      else { await navigator.clipboard.writeText(url); toast.success(t("toast.linkCopied")); }
    } catch { /* cancelled */ }
  };

  const items = stories.data?.items || [];
  const name = u.display_name || u.username;

  return (
    <div className="app-shell" style={{ background: "var(--bg)" }}>
      <Seo
        title={`${name} — Horror Stories`}
        description={(u.bio || `Read ${name}'s horror stories on Pretika — ${compact(u.total_followers || 0)} followers, ${compact(u.total_stories_published || 0)} stories.`).slice(0, 160)}
        image={thumbFor(u.avatar_url, u.username)}
        path={`/u/${username}`}
        type="profile"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name,
            alternateName: `@${u.username}`,
            description: u.bio || undefined,
            image: thumbFor(u.avatar_url, u.username),
            url: `https://pretika.in/u/${username}`,
            interactionStatistic: {
              "@type": "InteractionCounter",
              interactionType: "https://schema.org/FollowAction",
              userInteractionCount: u.total_followers || 0,
            },
          },
        }}
      />

      {/* Cover */}
      <div className="pf-cover scene-3d">
        <ProfileCover coverUrl={u.cover_image_url} id={u.id} seed={u.username} />
        <button onClick={() => nav(-1)} className="glass" style={floatBtn(12, 12)}><ArrowLeft size={20} /></button>
        <button onClick={share} className="glass" style={floatBtn(12, null, 12)}><Share2 size={18} /></button>
      </div>

      <div className="container" style={{ maxWidth: 920 }}>
        {/* Header card — avatar straddles cover, name sits below in content */}
        <div style={{ marginTop: -54, position: "relative", zIndex: 2 }}>
          <div className="between" style={{ alignItems: "flex-end", gap: 12 }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ ease: [0.16, 1, 0.3, 1] }} style={{ flexShrink: 0 }}>
              <Img path={u.avatar_url} seed={u.username} kind="avatar" alt={name}
                style={avatar} />
            </motion.div>
            {!isSelf && (
              <div className="row gap-8">
                <button className="btn btn-outline" onClick={onMessage} disabled={startChat.isPending} style={{ minWidth: 44 }} aria-label={t("chat.message")}>
                  <MessageCircle size={16} /> <span className="only-desktop">{t("chat.message")}</span>
                </button>
                <button className={`btn ${isFollowing ? "btn-ghost" : "btn-primary"}`} onClick={toggleFollow} style={{ minWidth: 110 }}>
                  {isFollowing ? t("story.following") : t("story.follow")}
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="row gap-8" style={{ flexWrap: "wrap", alignItems: "center" }}>
              <h1 className="serif pf-name" style={{ fontSize: 25 }}>{name}</h1>
              {u.is_verified_creator && <BadgeCheck size={20} color="var(--blue)" style={{ flexShrink: 0 }} />}
            </div>
            <div className="tertiary" style={{ fontSize: 13.5, marginTop: 1 }}>@{u.username}</div>
          </div>

          {u.bio && <p className="muted" style={{ fontSize: 14.5, marginTop: 14, lineHeight: 1.65, maxWidth: 640 }}>{u.bio}</p>}

          {/* Stats */}
          <div className="row" style={statsRow}>
            <Stat icon={<BookOpen size={16} />} n={u.total_stories_published} label={t("profile.stories")} />
            <Sep />
            <Stat icon={<Users size={16} />} n={u.total_followers} label={t("common.followers")} onClick={() => setFollowSheet("followers")} />
            <Sep />
            <Stat icon={<PenLine size={16} />} n={u.total_following} label={t("common.following")} onClick={() => setFollowSheet("following")} />
            <Sep />
            <Stat icon={<Eye size={16} />} n={u.total_views_received} label={t("common.views")} />
          </div>
        </div>

        {/* Stories */}
        <div style={{ marginTop: 26 }}>
          <div className="section-title mb-16 row gap-8"><BookOpen size={18} color="var(--indigo-600)" /> {t("explore.stories")}</div>
          {stories.isLoading ? (
            <div className="poster-grid">{Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} h={210} r={16} />)}</div>
          ) : items.length === 0 ? (
            <EmptyState icon={<BookOpen size={32} />} sub={t("common.nothingHere")} />
          ) : (
            <div className="poster-grid" style={{ paddingBottom: 12 }}>
              {items.map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}
            </div>
          )}
        </div>
        <div style={{ height: 28 }} />
      </div>

      <FollowListSheet
        open={!!followSheet}
        type={followSheet || "followers"}
        userId={u.id}
        onClose={() => setFollowSheet(null)}
      />
    </div>
  );
}

const Stat = ({ icon, n, label, onClick }) => {
  const inner = (
    <>
      <div className="row gap-4" style={{ justifyContent: "center", fontWeight: 800, fontSize: 18 }}>
        <span style={{ color: "var(--indigo-600)" }}>{icon}</span>{compact(n ?? 0)}
      </div>
      <div className="tertiary" style={{ fontSize: 11.5, marginTop: 2 }}>{label}</div>
    </>
  );
  if (onClick) return <button onClick={onClick} style={{ textAlign: "center", minWidth: 64, cursor: "pointer" }}>{inner}</button>;
  return <div style={{ textAlign: "center", minWidth: 64 }}>{inner}</div>;
};
const Sep = () => <div style={{ width: 1, height: 30, background: "var(--border-solid)" }} />;

const avatar = {
  width: 104, height: 104, borderRadius: "50%", objectFit: "cover",
  border: "4px solid var(--bg)", background: "var(--bg-tertiary)",
  boxShadow: "0 12px 30px rgba(40,20,12,.28)",
};
const statsRow = {
  marginTop: 16, justifyContent: "space-between", maxWidth: 480, padding: "14px 18px",
  border: "1px solid var(--border-solid)", borderRadius: 16, background: "var(--bg-card)",
  boxShadow: "var(--shadow-sm)",
};
const floatBtn = (top, left, right) => ({
  position: "absolute", top, left: left ?? "auto", right: right ?? "auto",
  width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center",
  color: "var(--text-primary)", zIndex: 5,
});

function ProfileSkeleton() {
  return (
    <div className="app-shell">
      <SkeletonBox h={150} r={0} />
      <div className="container" style={{ maxWidth: 920, marginTop: -54 }}>
        <SkeletonBox w={104} h={104} r={52} />
        <SkeletonBox h={22} w={180} style={{ marginTop: 14 }} />
        <SkeletonBox h={14} w={120} style={{ marginTop: 8 }} />
        <SkeletonBox h={64} style={{ marginTop: 16, maxWidth: 480 }} />
        <div className="poster-grid" style={{ marginTop: 26 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} h={210} r={16} />)}
        </div>
      </div>
    </div>
  );
}
