import { useMemo, useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Settings, Bookmark, PenSquare, LogOut, ChevronRight, LifeBuoy,
  BadgeCheck, LogIn, History, CheckCircle2, Flame, Coins,
  Camera, Pencil, Loader2, ExternalLink, Languages, UserPlus,
} from "lucide-react";
import LangToggle from "../components/LangToggle";
import { RankIcon, Spook } from "../components/Art";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAuth } from "../store/auth";
import { useBookmarked } from "../lib/hooks";
import { StoryRow } from "../components/StoryCard";
import FollowListSheet from "../components/FollowListSheet";
import EmptyState from "../components/EmptyState";
import Img from "../components/Img";
import ProfileCover from "../components/ProfileCover";
import ImageUploadPreview from "../components/ImageUploadPreview";
import Seo from "../components/Seo";
import { api, unwrap, errMsg } from "../lib/api";
import { compact } from "../lib/format";
import { READER_RANKS, rankProgress } from "../lib/format";
import { getAllProgress } from "../lib/reading";

export default function Profile() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const fetchMe = useAuth((s) => s.fetchMe);
  const logout = useAuth((s) => s.logout);
  const authed = useAuth((s) => s.isAuthed)();
  const [followSheet, setFollowSheet] = useState(null); // null | "followers" | "following"
  const bookmarks = useBookmarked(authed);
  const history = useMemo(() => getAllProgress(), []);

  const coverRef = useRef();
  const avatarRef = useRef();
  const [busyCover, setBusyCover] = useState(false);
  const [busyAvatar, setBusyAvatar] = useState(false);
  const [pending, setPending] = useState(null); // { file, kind } awaiting preview approval

  // Refresh /users/me each time the profile opens so freshly earned reader XP
  // (comments +5, episode complete +25, daily login +10) shows the up-to-date
  // rank/score without a full page reload. init/login already hydrate on boot.
  useEffect(() => {
    if (authed) fetchMe().catch(() => {});
  }, [authed, fetchMe]);

  if (!authed) return <GuestProfile />;

  const rankKey = user?.reader_fear_rank || "raat_ka_musafir";
  const rank = READER_RANKS[rankKey] || READER_RANKS.raat_ka_musafir;
  const score = user?.reader_rank_score ?? 0;
  const progress = rankProgress(score, rankKey);

  // Image edit — pick → preview the exact crop → PUT /users/me/{cover|avatar}
  // (JPG/PNG/WebP ≤5MB). Nothing is uploaded until the preview is confirmed.
  const pickImage = (e, kind) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error(t("common.maxImage5"));
    setPending({ file, kind });
  };

  const uploadPending = async () => {
    if (!pending) return;
    const { file, kind } = pending;
    const setBusy = kind === "cover" ? setBusyCover : setBusyAvatar;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.put(`/users/me/${kind}`, fd, { headers: { "Content-Type": "multipart/form-data" } }).then(unwrap);
      await fetchMe();
      setPending(null);
      toast.success(t(kind === "cover" ? "profile.coverUpdated" : "profile.photoUpdated"));
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const doLogout = async () => {
    await logout();
    toast.success(t("toast.bye"));
    nav("/login");
  };

  return (
    <div className="page">
      <Seo title="My Profile" robots="noindex, follow" />
      <div className="page-scroll">

        {/* ═══ Cover — editable in place ═══ */}
        <div className="pf-cover">
          <ProfileCover coverUrl={user?.cover_image_url} id={user?.id} seed={user?.username} />
          <button
            className="pf-cam glass"
            style={{ position: "absolute", right: 14, bottom: 14 }}
            onClick={() => !busyCover && coverRef.current?.click()}
            aria-label={t("profile.changeCover")}
          >
            {busyCover ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
            <span className="only-desktop">{t("profile.changeCover")}</span>
          </button>
          <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pickImage(e, "cover")} />
        </div>

        <div className="container" style={{ maxWidth: 920 }}>
          {/* ═══ Avatar (straddles cover) + actions — name sits below, in content ═══ */}
          <div className="between" style={{ alignItems: "flex-end", gap: 12, marginTop: -52, position: "relative", zIndex: 2 }}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ ease: [0.16, 1, 0.3, 1] }} style={{ position: "relative", width: 104, height: 104, flexShrink: 0 }}>
              <Img path={user?.avatar_url} seed={user?.username} kind="avatar" alt=""
                style={{
                  width: 104, height: 104, borderRadius: "50%", objectFit: "cover",
                  border: "4px solid var(--bg)", background: "var(--bg-tertiary)",
                  boxShadow: "0 12px 30px rgba(40,20,12,.28)",
                  filter: busyAvatar ? "brightness(.6)" : "none", transition: "filter .2s ease",
                }} />
              {busyAvatar && (
                <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff" }}>
                  <Loader2 size={22} className="spin" />
                </span>
              )}
              <button
                className="pf-pen"
                onClick={() => !busyAvatar && avatarRef.current?.click()}
                aria-label={t("profile.changePhoto")}
              >
                <Pencil size={14} />
              </button>
              <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pickImage(e, "avatar")} />
            </motion.div>

            <div className="row gap-8" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Link to="/profile/edit" className="btn btn-ghost btn-sm"><Pencil size={14} /> {t("profile.edit")}</Link>
              {user?.username && (
                <Link to={`/u/${user.username}`} className="btn btn-outline btn-sm" title={t("profile.viewPublic")}>
                  <ExternalLink size={14} /> <span className="only-desktop">{t("profile.viewPublic")}</span>
                </Link>
              )}
            </div>
          </div>

          {/* ═══ Name + handle — fully below the cover ═══ */}
          <div style={{ marginTop: 12 }}>
            <div className="row gap-8" style={{ flexWrap: "wrap", alignItems: "center" }}>
              <h1 className="serif pf-name">{user?.display_name || user?.username}</h1>
              {user?.is_verified_creator && <BadgeCheck size={20} color="var(--blue)" style={{ flexShrink: 0 }} />}
            </div>
            <div className="tertiary" style={{ fontSize: 13.5, marginTop: 1 }}>@{user?.username}</div>
          </div>

          {user?.bio && <p className="muted" style={{ fontSize: 14, marginTop: 12, lineHeight: 1.65, maxWidth: 640 }}>{user.bio}</p>}

          {/* ═══ Stats ═══ */}
          <div className="row card" style={{ marginTop: 16, justifyContent: "space-around", padding: "14px 10px", maxWidth: 480 }}>
            <Stat n={user?.total_stories_published} label={t("profile.stories")} />
            <Divider />
            <Stat n={user?.total_followers} label={t("common.followers")} onClick={() => setFollowSheet("followers")} />
            <Divider />
            <Stat n={user?.total_following} label={t("common.following")} onClick={() => setFollowSheet("following")} />
          </div>

          <div className="pf-grid">
            <div>
              {/* ═══ Rank card ═══ */}
              <div className="card" style={{ padding: 16, marginTop: 14 }}>
                <div className="between">
                  <div className="row gap-10">
                    <div style={{ width: 46, height: 46, borderRadius: 12, display: "grid", placeItems: "center", background: "var(--indigo-50)", border: "1px solid var(--indigo-100)" }}>
                      <RankIcon rank={rankKey} size={26} color="var(--crimson)" />
                    </div>
                    <div>
                      <div className="tertiary" style={{ fontSize: 11 }}>{t("profile.readerRank")}</div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{t(`ranks.${rankKey}`)}</div>
                    </div>
                  </div>
                  <div className="badge badge-indigo">{t("common.level", { n: rank.level })}</div>
                </div>
                <div style={{ marginTop: 12, height: 8, background: "var(--bg-tertiary)", borderRadius: 8, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.8 }}
                    style={{ height: "100%", background: "linear-gradient(90deg,var(--indigo-800),var(--indigo-400))", borderRadius: 8 }} />
                </div>
                <div className="between tertiary" style={{ fontSize: 11, marginTop: 6 }}>
                  <span>{compact(score)} {t("profile.xp")}</span>
                  <span className="row gap-4"><Flame size={12} color="var(--crimson)" /> {t("profile.streak", { n: user?.login_streak || 0 })}</span>
                </div>
              </div>

              {/* ═══ Menu ═══ */}
              <div className="card" style={{ marginTop: 14 }}>
                <MenuItem icon={<Bookmark size={19} />} label={t("profile.bookmarks")} extra={compact(bookmarks.data?.items?.length || 0)} onClick={() => document.getElementById("saved")?.scrollIntoView({ behavior: "smooth" })} />
                <MenuItem icon={<History size={19} />} label={t("profile.readingHistory")} extra={compact(history.length)} onClick={() => document.getElementById("history")?.scrollIntoView({ behavior: "smooth" })} />
                <MenuItem icon={<Coins size={19} />} label={t("wallet.title")} to="/wallet" />
                <MenuItem icon={<UserPlus size={19} />} label={t("invite.title")} to="/invite" />
                {user?.is_creator
                  ? <MenuItem icon={<PenSquare size={19} />} label={t("creator.dashboard")} to="/creator-dashboard" />
                  : <MenuItem icon={<PenSquare size={19} />} label={t("profile.becomeCreator")} to="/become-creator" />}
                <MenuItem icon={<Settings size={19} />} label={t("profile.settings")} to="/profile/edit" />
                <MenuItem icon={<LifeBuoy size={19} />} label={t("support.title")} to="/support" />
                <div className="between" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-solid)" }}>
                  <div className="row gap-12">
                    <Languages size={19} /> <span style={{ fontWeight: 600, fontSize: 14.5 }}>{t("profile.language")}</span>
                  </div>
                  <LangToggle />
                </div>
                <MenuItem icon={<LogOut size={19} color="var(--indigo-600)" />} label={t("auth.logout")} danger onClick={doLogout} last />
              </div>
            </div>

            <div>
              {/* ═══ Reading history (local) ═══ */}
              <div id="history" style={{ marginTop: 14 }}>
                <div className="section-title mb-8" style={{ fontSize: 17 }}>{t("profile.readingHistory")}</div>
                {history.length === 0 ? (
                  <EmptyState icon={<History size={32} />} sub={t("profile.noHistory")} />
                ) : (
                  history.slice(0, 20).map((h) => <HistoryRow key={h.story_id} h={h} t={t} />)
                )}
              </div>

              {/* ═══ Saved stories ═══ */}
              <div id="saved" style={{ marginTop: 22 }}>
                <div className="section-title mb-8" style={{ fontSize: 17 }}>{t("profile.bookmarks")}</div>
                {bookmarks.isLoading ? null :
                  bookmarks.data?.items?.length ? (
                    bookmarks.data.items.map((s, i) => <StoryRow key={s.id} story={s} index={i} />)
                  ) : (
                    <EmptyState icon={<Bookmark size={32} />} sub={t("common.nothingHere")} />
                  )}
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>
      <FollowListSheet
        open={!!followSheet}
        type={followSheet || "followers"}
        userId={user?.id}
        onClose={() => setFollowSheet(null)}
      />
      <ImageUploadPreview
        open={!!pending}
        kind={pending?.kind}
        file={pending?.file}
        busy={pending?.kind === "cover" ? busyCover : busyAvatar}
        onCancel={() => setPending(null)}
        onPickAnother={() => (pending?.kind === "cover" ? coverRef : avatarRef).current?.click()}
        onConfirm={uploadPending}
      />
    </div>
  );
}

function GuestProfile() {
  const { t } = useTranslation();
  return (
    <div className="page">
      <div className="page-scroll" style={{ display: "grid", placeItems: "center", minHeight: "70dvh" }}>
        <div className="center container">
          <div className="pk-float" style={{ display: "grid", placeItems: "center" }}><Spook size={88} tone="light" /></div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>{t("profile.guest")}</div>
          <p className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{t("profile.loginToView")}</p>
          <Link to="/login" className="btn btn-primary btn-block mt-24"><LogIn size={18} /> {t("auth.login")}</Link>
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ h, t }) {
  const pct = Math.max(0, Math.min(100, Math.round(h.scroll_percentage || 0)));
  const to = h.episode_id ? `/read/${h.story_id}/${h.episode_id}` : (h.story_slug ? `/story/${h.story_slug}` : "#");
  return (
    <Link to={to} className="row gap-12" style={{ padding: "10px 0" }}>
      <div style={{ position: "relative", width: 56, height: 78, flexShrink: 0 }}>
        <Img path={h.thumbnail_url} seed={h.story_id} alt={h.story_title}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
        {h.is_completed && (
          <span style={{ position: "absolute", top: 4, right: 4, color: "var(--green)", background: "#fff", borderRadius: "50%", lineHeight: 0 }}>
            <CheckCircle2 size={16} />
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="clamp-2" style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.25 }}>{h.story_title || t("common.loading")}</div>
        <div className="tertiary" style={{ fontSize: 11.5, marginTop: 4 }}>
          {t("story.episode")} {h.episode_number || 1}{h.episode_title ? ` · ${h.episode_title}` : ""}
        </div>
        <div style={{ marginTop: 6, height: 5, background: "var(--bg-tertiary)", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: h.is_completed ? "var(--green)" : "var(--indigo-600)", borderRadius: 6 }} />
        </div>
      </div>
      <ChevronRight size={16} className="tertiary" />
    </Link>
  );
}

const Stat = ({ n, label, onClick }) => {
  const inner = (
    <>
      <div style={{ fontWeight: 800, fontSize: 17 }}>{compact(n ?? 0)}</div>
      <div className="tertiary" style={{ fontSize: 11 }}>{label}</div>
    </>
  );
  if (onClick) return <button onClick={onClick} style={{ textAlign: "center", cursor: "pointer", padding: "2px 10px", borderRadius: 10 }}>{inner}</button>;
  return <div style={{ textAlign: "center", padding: "2px 10px" }}>{inner}</div>;
};
const Divider = () => <div style={{ width: 1, height: 28, background: "var(--border-solid)" }} />;

function MenuItem({ icon, label, extra, to, onClick, danger, last }) {
  const inner = (
    <div className="between pf-menu-row" style={{ padding: "14px 16px", borderBottom: last ? "none" : "1px solid var(--border-solid)" }}>
      <div className="row gap-12" style={{ color: danger ? "var(--indigo-600)" : "var(--text-primary)" }}>
        {icon} <span style={{ fontWeight: 600, fontSize: 14.5 }}>{label}</span>
      </div>
      <div className="row gap-6 tertiary" style={{ fontSize: 13 }}>{extra}<ChevronRight size={16} /></div>
    </div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return <button onClick={onClick} style={{ width: "100%", textAlign: "left" }}>{inner}</button>;
}
