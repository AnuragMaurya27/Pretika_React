import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Flame, Sparkles, Users, ChevronRight, BadgeCheck,
  BookOpen, Star, Eye, Feather, ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useStories, useCategories, useAnnouncements, useTopCreators, useFollow } from "../lib/hooks";
import { StoryCard } from "../components/StoryCard";
import Img from "../components/Img";
import Seo from "../components/Seo";
import Tilt from "../components/Tilt";
import { HRailSkeleton, SkeletonBox } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import ChatStoriesRail from "../components/ChatStoriesRail";
import LangToggle from "../components/LangToggle";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../store/auth";
import { mediaUrl } from "../lib/constants";
import { compact } from "../lib/format";
import { getAllProgress } from "../lib/reading";
import { rankTrending } from "../lib/trending";
import { EyeLogo, Candle, CategoryIcon } from "../components/Art";
import { errMsg } from "../lib/api";
import { categoryLabel } from "../lib/categories";

// Social-share fallback image for <Seo> (hero itself is drawn from live covers).
const HERO_IMG = "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1600&q=70";

export default function Home() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);

  const fresh = useStories({ sort_by: "latest", page_size: 12 });
  const cats = useCategories();
  const announcements = useAnnouncements();
  const mostViewed = useStories({ sort_by: "most_viewed", page_size: 50 });

  // "Trending" is ranked live on the client (engagement + recency) because the
  // API's trending sort orders by a score the backend never populates — see
  // lib/trending.js. Pool = every published story we've already fetched.
  const trendingItems = useMemo(() => {
    const byId = new Map();
    for (const s of [...(mostViewed.data?.items || []), ...(fresh.data?.items || [])]) {
      if (s && !byId.has(s.id)) byId.set(s.id, s);
    }
    return rankTrending([...byId.values()], 12);
  }, [mostViewed.data, fresh.data]);
  const trendingLoading = mostViewed.isLoading && fresh.isLoading;

  // Category rails: only for the categories of the 5 most-viewed ("reading
  // viewer") stories — and only if that category actually has a story. We sort
  // client-side since the API doesn't reliably order /stories by views.
  const topCategories = useMemo(() => {
    const catById = new Map((cats.data || []).map((c) => [c.id, c]));
    const top5 = (mostViewed.data?.items || [])
      .slice()
      .sort((a, b) => (b.total_views ?? 0) - (a.total_views ?? 0))
      .slice(0, 5);
    const seen = new Set();
    const out = [];
    for (const s of top5) {
      const c = s.category_id && catById.get(s.category_id);
      if (!c || seen.has(c.id) || (c.total_stories ?? 0) < 1) continue;
      seen.add(c.id);
      out.push(c);
    }
    return out;
  }, [mostViewed.data, cats.data]);

  const name = user?.display_name || user?.username || "";

  return (
    <div className="page">
      <Seo
        title="Hindi Horror Stories — डरावनी भूतिया कहानियाँ"
        description="Read spine-chilling Hindi horror stories (डरावनी भूतिया कहानियाँ) free on Pretika — bhoot, chudail & jinn kahaniyan, haunted tales, trending series & top creators. Read & write horror that follows you home."
        path="/home"
        image={HERO_IMG}
      />
      <div className="page-scroll">
        {/* Mobile charcoal header — search now lives in the bottom tab bar, not here */}
        <header className="only-mobile" style={mHeader}>
          <div className="between" style={{ padding: "12px 16px" }}>
            <div className="row gap-10">
              <EyeLogo size={34} />
              <div>
                <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11.5 }}>{t("home.namaste")}</div>
                <div className="display" style={{ color: "#fff", fontSize: 19, fontWeight: 700, lineHeight: 1.1 }}>
                  {name || "Pretika"}
                </div>
              </div>
            </div>
            <div className="row gap-8">
              <LangToggle dark />
              {user && <NotificationBell dark />}
            </div>
          </div>
        </header>

        {/* Editorial hero — ink headline + floating fan of real trending covers */}
        <Hero name={name} covers={trendingItems} loading={trendingLoading} />

        {/* Announcements */}
        {announcements.data?.length > 0 && (
          <div className="container" style={{ paddingTop: 14 }}>
            <div className="hscroll">
              {announcements.data.map((a) => (
                <div key={a.id} style={annCard}>
                  {a.banner_url && <img src={mediaUrl(a.banner_url)} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />}
                  <div style={{ minWidth: 0 }}>
                    <div className="clamp-1" style={{ fontWeight: 700, fontSize: 13 }}>{a.title}</div>
                    <div className="clamp-1 muted" style={{ fontSize: 11.5 }}>{a.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="container" style={{ marginTop: 18 }}>
          {cats.isLoading ? (
            <div className="hscroll">{Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} w={92} h={36} r={20} />)}</div>
          ) : (
            <div className="hscroll">
              <button className="chip active" onClick={() => nav("/explore")}><Sparkles size={15} /> {t("home.all")}</button>
              {(cats.data || []).filter((c) => (c.total_stories ?? 0) > 0).map((c) => (
                <button key={c.id} className="chip" onClick={() => nav(`/explore?category=${encodeURIComponent(c.slug)}`)}>
                  <CategoryIcon name={c.name} size={15} /> {categoryLabel(c)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Continue reading — local progress, resumes exactly where you left */}
        <ContinueRail />

        {/* Pretika Chats — found-footage phone-chat horror (hides itself when empty) */}
        <ChatStoriesRail />

        {/* Trending — with Netflix-style rank numbers */}
        <Section title={t("home.trending")} icon={<Flame size={18} color="var(--indigo-600)" />} to="/explore?sort=trending">
          {trendingLoading ? <HRailSkeleton /> : (
            <Rail>{trendingItems.map((s, i) => <StoryCard key={s.id} story={s} index={i} rank={i + 1} />)}</Rail>
          )}
        </Section>

        {/* Spotlight — cinematic feature of the #1 trending story */}
        {!trendingLoading && trendingItems[0] && (
          <Spotlight story={trendingItems[0]} />
        )}

        {/* New stories */}
        <Section title={t("home.newStories")} icon={<Sparkles size={18} color="var(--gold)" />} to="/explore?sort=latest">
          {fresh.isLoading ? <HRailSkeleton /> : (
            <Rail>{(fresh.data?.items || []).map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}</Rail>
          )}
        </Section>

        {/* Category rails — one per category among the top-5 most-viewed stories */}
        {topCategories.map((c) => <CategorySection key={c.id} category={c} />)}

        {/* New creators */}
        <NewCreators />

        {/* Writer CTA — candle-lit closing band */}
        <WriterCta />

        <div style={{ height: 18 }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════ HERO ═══════════════════════════════ */

// staggered word-reveal for the Devanagari headline
const lineVar = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};
// No filter/blur here: an animated filter promotes each word to its own
// rasterized layer whose box clips Devanagari overshoot (chandrabindu, matras)
// and leaves stale text-shadow rectangles. Opacity + y keeps the reveal clean.
const wordVar = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

// drips per word of the crimson line — positions are % of THAT word's width,
// so blood always beads off the glyphs themselves at every viewport size.
const WORD_DRIPS = [
  [{ left: "22%", delay: 1.6, dur: 9.5, w: 7 }, { left: "74%", delay: 5.6, dur: 11.5, w: 6 }],
  [{ left: "34%", delay: 3.8, dur: 10.5, w: 8 }, { left: "82%", delay: 7.8, dur: 12.5, w: 6.5 }],
  [{ left: "52%", delay: 2.6, dur: 9, w: 7 }],
];

// Headline per UI language — line 2 carries the blood drips (3 words each).
const HERO_LINES = {
  hi: { l1: ["जहाँ", "अंधेरा"], l2: ["कहानी", "सुनाता", "है"] },
  en: { l1: ["Where", "darkness"], l2: ["tells", "the", "story"] },
};

function Hero({ name, covers, loading }) {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const isHi = i18n.language === "hi";
  const lines = HERO_LINES[isHi ? "hi" : "en"];
  return (
    <section className="container" style={{ paddingTop: "clamp(24px, 4.5vw, 52px)" }}>
      <div className="hero-grid">
        {/* ── left: ink copy ── */}
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={heroEyebrow}
          >
            <EyeLogo size={20} /> {name ? `${t("home.welcomeBack")}, ${name}` : t("home.brandTag")}
          </motion.span>

          <motion.h1
            key={isHi ? "hi" : "en"}
            className={`hero-title ${isHi ? "display-hi" : "display"}`}
            variants={lineVar}
            initial="hidden"
            animate="show"
            style={heroTitle}
            lang={isHi ? "hi" : "en"}
          >
            <span style={{ display: "block" }}>
              {lines.l1.map((w) => (
                <motion.span key={w} variants={wordVar} style={heroWord}>{w}</motion.span>
              ))}
            </span>
            <span style={{ display: "block" }}>
              {lines.l2.map((w, wi) => (
                <motion.span key={w} variants={wordVar} className="gradient-text bleed-word" style={heroWord}>
                  {w}
                  {!reduce && (WORD_DRIPS[wi] || []).map((d, i) => (
                    <span key={i} className="drip" aria-hidden style={{
                      left: d.left, "--delay": `${d.delay}s`, "--dur": `${d.dur}s`, "--w": `${d.w}px`,
                    }}>
                      <i className="drip-bead" /><i className="drip-fall" />
                    </span>
                  ))}
                </motion.span>
              ))}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="muted"
            style={{ marginTop: 30, maxWidth: 480, fontSize: "clamp(14.5px, 1.6vw, 16.5px)", lineHeight: 1.65 }}
          >
            {t("home.heroSub")}
          </motion.p>

          <motion.div
            className="row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.15 }}
            style={{ gap: 8, marginTop: 24, flexWrap: "wrap" }}
          >
            <span className="chip" style={heroStat}><Flame size={14} color="var(--crimson)" /> {t("home.chipDaily")}</span>
            <span className="chip" style={heroStat}><BookOpen size={14} color="var(--crimson)" /> {t("home.chipStories")}</span>
            <span className="chip" style={heroStat}><Users size={14} color="var(--crimson)" /> {t("home.chipWriters")}</span>
          </motion.div>
        </div>

        {/* ── right: floating fan of live trending covers ── */}
        <CoverFan covers={covers} loading={loading} />
      </div>
    </section>
  );
}


/* Fanned deck of the top trending covers — springy spread on hover,
   gentle idle float, every card links to its story. */
const FAN_POSES = [
  { r: -14, x: 0, y: 26, spread: -26 },
  { r: -5, x: 0, y: 6, spread: -10 },
  { r: 4, x: 0, y: 0, spread: 8 },
  { r: 13, x: 0, y: 22, spread: 24 },
];

function CoverFan({ covers = [], loading }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const items = covers.slice(0, 4);
  const n = items.length || 3;

  return (
    <motion.div
      className="fan-wrap"
      initial="rest"
      whileHover="spread"
      animate="rest"
    >
      <div className="fan-glow" />
      <motion.div
        animate={reduce ? {} : { y: [0, -9, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {(items.length ? items : Array.from({ length: n })).map((s, i) => {
          const pose = FAN_POSES[i + Math.floor((FAN_POSES.length - n) / 2)] || FAN_POSES[i];
          const isTop = s && i === 0;
          return (
            <motion.div
              key={s?.id || i}
              variants={{
                rest: { rotate: pose.r, y: pose.y, x: 0 },
                spread: { rotate: pose.r * 1.2, y: pose.y - 10, x: pose.spread },
              }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              whileHover={{ scale: 1.07, rotate: 0, zIndex: 9 }}
              style={{
                marginLeft: i === 0 ? 0 : "calc(clamp(124px, 30vw, 212px) * -0.44)",
                zIndex: n - i,
                position: "relative",
              }}
            >
              {s ? (
                <Link to={`/story/${s.slug}`} className="fan-card" title={s.title}>
                  <Img path={s.thumbnail_url} seed={s.id} alt={s.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {isTop && (
                    <span style={fanBadge}><Flame size={11} /> {t("home.topTrending")}</span>
                  )}
                </Link>
              ) : (
                <div className={`fan-card ${loading ? "shimmer" : ""}`} />
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════ CONTINUE READING RAIL ═══════════════════════ */

function ContinueRail() {
  const { t } = useTranslation();
  const items = useMemo(
    () => getAllProgress().filter((h) => h.story_title && h.episode_id).slice(0, 10),
    [],
  );
  if (!items.length) return null;
  return (
    <Section title={t("home.continueReading")} icon={<BookOpen size={18} color="var(--crimson)" />}>
      <div className="container">
        <div className="hscroll" style={{ paddingBottom: 6 }}>
          {items.map((h) => {
            const pct = Math.max(0, Math.min(100, Math.round(h.scroll_percentage || 0)));
            return (
              <div key={h.story_id}>
                <Link to={`/read/${h.story_id}/${h.episode_id}`} className="hover-lift" style={contCard}>
                  <Img path={h.thumbnail_url} seed={h.story_id} alt=""
                    style={{ width: 52, height: 72, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="clamp-2" style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>{h.story_title}</div>
                    <div className="tertiary" style={{ fontSize: 11, marginTop: 3 }}>
                      {t("story.episode")} {h.episode_number || 1} · {pct}%
                    </div>
                    <div style={{ marginTop: 7, height: 4, background: "var(--bg-tertiary)", borderRadius: 4, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: "100%", background: "linear-gradient(90deg, var(--crimson-mid), var(--crimson))", borderRadius: 4 }}
                      />
                    </div>
                  </div>
                  <ChevronRight size={15} className="tertiary" style={{ flexShrink: 0 }} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════ SECTIONS ═══════════════════════════ */

function Section({ title, icon, to, children }) {
  const { t } = useTranslation();
  return (
    <section style={{ marginTop: 30 }}>
      <div className="container sec-head" style={{ marginBottom: 12 }}>
        <div className="row gap-8 section-title">{icon} {title}</div>
        <div className="sec-rule" />
        {to && <Link to={to} className="see-all">{t("home.seeAll")} <ChevronRight size={16} /></Link>}
      </div>
      {children}
    </section>
  );
}

function Rail({ children }) {
  const arr = Array.isArray(children) ? children : [children];
  if (!arr.length) return <EmptyState sub="—" />;
  return <div className="container"><div className="hscroll" style={{ paddingBottom: 6 }}>{children}</div></div>;
}

// One horizontal rail for a single category, fetched on demand. Renders nothing
// if the category has no stories (safety net — it always should have ≥1).
function CategorySection({ category }) {
  const { data, isLoading } = useStories({ category: category.slug, page_size: 12 });
  const items = data?.items || [];
  if (!isLoading && !items.length) return null;
  return (
    <Section
      title={categoryLabel(category)}
      icon={<CategoryIcon name={category.name} size={18} color="var(--indigo-600)" />}
      to={`/explore?category=${encodeURIComponent(category.slug)}`}
    >
      {isLoading
        ? <HRailSkeleton />
        : <Rail>{items.map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}</Rail>}
    </Section>
  );
}

function NewCreators() {
  const { t } = useTranslation();
  const authed = useAuth((s) => s.isAuthed)();
  const { data, isLoading } = useTopCreators();
  const follow = useFollow();
  const [done, setDone] = useState({});
  const creators = (data || []).filter((e) => e.creator_username).slice(0, 10);
  if (!isLoading && !creators.length) return null;

  const onFollow = (c) => {
    if (!authed) return toast.error(t("toast.loginRequired"));
    const id = c.entity_id;
    setDone((d) => ({ ...d, [id]: !d[id] }));
    follow.mutate({ id, following: done[id] }, { onError: (e) => { setDone((d) => ({ ...d, [id]: !d[id] })); toast.error(errMsg(e)); } });
  };

  return (
    <Section title={t("home.newCreators")} icon={<Users size={18} color="var(--indigo-600)" />}>
      <div className="container"><div className="hscroll" style={{ paddingBottom: 6 }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} w={150} h={150} r={16} />)
          : creators.map((c) => (
              <div
                key={c.entity_id}
                className="hover-lift"
                style={creatorCard}
              >
                <Link to={`/u/${c.creator_username}`} style={{ display: "block" }}>
                  <Img path={c.creator_avatar_url} seed={c.creator_username} kind="avatar" alt=""
                    style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--indigo-50)", margin: "0 auto" }} />
                  <div className="row gap-4" style={{ marginTop: 8, justifyContent: "center" }}>
                    <span className="clamp-1" style={{ fontWeight: 700, fontSize: 13 }}>{c.creator_display_name || c.creator_username}</span>
                    {c.creator_is_verified && <BadgeCheck size={13} color="var(--indigo-600)" />}
                  </div>
                </Link>
                <button className={`btn btn-sm ${done[c.entity_id] ? "btn-ghost" : "btn-primary"}`} style={{ marginTop: 10, width: "100%" }} onClick={() => onFollow(c)}>
                  {done[c.entity_id] ? t("home.following") : t("home.follow")}
                </button>
              </div>
            ))}
      </div></div>
    </Section>
  );
}

/* ═══════════════════════════ SPOTLIGHT ═══════════════════════════ */

function Spotlight({ story }) {
  const { t } = useTranslation();
  return (
    <section className="container" style={{ marginTop: 34 }}>
      <Link to={`/story/${story.slug}`} className="sotd">
        {/* poster with soft glow + star seal */}
        <div className="sotd-poster-wrap scene-3d">
          <span className="sotd-glow" aria-hidden />
          <Tilt max={9} scale={1.05} className="sotd-poster">
            <Img path={story.thumbnail_url} seed={story.id} alt={story.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Tilt>
          <span className="sotd-seal" aria-hidden><Star size={15} fill="#fff" color="#fff" /></span>
        </div>

        {/* editorial copy */}
        <div className="sotd-body">
          <span className="sotd-eyebrow">{t("home.spotlight")}</span>
          <h3 className="serif sotd-title clamp-2">{story.title}</h3>
          {story.summary
            ? <p className="sotd-sum clamp-2">{story.summary}</p>
            : <p className="sotd-sum clamp-2">{t("home.spotlightSub", { defaultValue: "Tonight's hand-picked terror — dim the lights and begin." })}</p>}
          <div className="sotd-meta">
            {story.category_name && <span className="sotd-cat">{categoryLabel(story.category_name)}</span>}
            {story.average_rating > 0 && (
              <span className="row gap-4"><Star size={13} fill="var(--gold)" color="var(--gold)" /> {story.average_rating.toFixed(1)}</span>
            )}
            <span className="row gap-4"><Eye size={13} /> {compact(story.total_views)}</span>
          </div>
          <span className="sotd-cta">{t("home.readNow")} <ArrowRight size={16} /></span>
        </div>
      </Link>
    </section>
  );
}

/* ═══════════════════════════ WRITER CTA ═══════════════════════════ */

// rising ember particles — deterministic positions so they don't reshuffle
const EMBERS = [
  { l: "8%", d: 0, dur: 7, s: 3, ex: "12px" }, { l: "20%", d: 1.4, dur: 8.5, s: 2, ex: "-10px" },
  { l: "33%", d: 3.2, dur: 6.5, s: 4, ex: "16px" }, { l: "46%", d: 0.8, dur: 9, s: 2.5, ex: "-14px" },
  { l: "60%", d: 2.4, dur: 7.5, s: 3, ex: "10px" }, { l: "72%", d: 4, dur: 8, s: 2, ex: "-8px" },
  { l: "84%", d: 1.1, dur: 6.8, s: 3.5, ex: "14px" }, { l: "93%", d: 3.6, dur: 9.5, s: 2.5, ex: "-12px" },
];

function WriterCta() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const reduce = useReducedMotion();
  return (
    <section className="container" style={{ marginTop: 40 }}>
      <div className="wcta">
        <div className="aurora" style={{ opacity: 0.4 }} />
        <div className="fog" style={{ opacity: 0.45 }} />
        {!reduce && (
          <div className="wcta-embers" aria-hidden>
            {EMBERS.map((e, i) => (
              <span key={i} className="wcta-ember" style={{
                left: e.l, width: e.s, height: e.s,
                "--ex": e.ex, animationDelay: `${e.d}s`, animationDuration: `${e.dur}s`,
              }} />
            ))}
          </div>
        )}
        <div className="wcta-inner">
          <div className="pk-float wcta-mark"><Candle size={72} /></div>
          <div className="wcta-copy">
            <span className="wcta-eyebrow"><Feather size={12} /> {t("home.writerEyebrow", { defaultValue: "Become a storyteller" })}</span>
            <div className="display-hi wcta-title" lang="hi">{t("home.writeTitle")}</div>
            <p className="wcta-sub">{t("home.writeSub")}</p>
          </div>
          <motion.button whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.96 }}
            onClick={() => nav("/creator/story/new")} className="wcta-btn">
            <Feather size={17} /> {t("home.writeBtn")}
          </motion.button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════ styles ═══════════════════════════ */

const heroEyebrow = {
  display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 14px 6px 7px", borderRadius: 999,
  background: "var(--bg-card)", border: "1px solid var(--border-dark)",
  color: "var(--text-secondary)", fontSize: 11.5, fontWeight: 700, letterSpacing: 1.4,
  textTransform: "uppercase", boxShadow: "var(--shadow-sm)",
};
const heroTitle = {
  // Display face comes from the `.hero-title` class (IM Fell English / Yatra
  // One) — both single-weight, so keep fontWeight 400 (bolder faux weights
  // mangle the Devanagari matras) and let the glow carry the menace.
  color: "var(--text-primary)", fontWeight: 400, lineHeight: 1.24, marginTop: 18,
  fontSize: "clamp(42px, 6.4vw, 80px)", letterSpacing: 0,
  textShadow: "0 2px 1px rgba(30,6,4,.2), 0 6px 34px rgba(156,28,20,.32)",
};
// Padding grows each word's paint box so Devanagari marks that overshoot the
// line box (ँ ऊपर, ु/ू नीचे) stay inside the gradient's background-clip:text
// area (outside it they paint transparent = "cropped"). Negative margins hand
// the space back so layout and the 0.26em word gap are unchanged.
const heroWord = {
  display: "inline-block",
  padding: "0.24em 0.12em",
  margin: "-0.24em calc(0.26em - 0.12em) -0.24em -0.12em",
  willChange: "transform",
};
const heroStat = { height: 32, fontSize: 12, pointerEvents: "none" };
const fanBadge = {
  position: "absolute", top: 10, left: 10, display: "inline-flex", alignItems: "center", gap: 5,
  padding: "5px 10px", borderRadius: 999, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4,
  background: "rgba(156,28,20,.94)", color: "#fff", boxShadow: "0 4px 14px rgba(70,9,7,.45)",
};

const mHeader = { background: "linear-gradient(180deg, #2a0a07, #150605)", position: "sticky", top: 0, zIndex: 20 };
const annCard = { display: "flex", alignItems: "center", gap: 10, minWidth: 250, maxWidth: 250, padding: 10, background: "var(--indigo-50)", border: "1px solid var(--indigo-100)", borderRadius: 12 };
const creatorCard = { minWidth: 150, width: 150, textAlign: "center", padding: 16, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16 };
const contCard = {
  display: "flex", alignItems: "center", gap: 12, minWidth: 260, maxWidth: 260,
  padding: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
  borderRadius: 16, boxShadow: "var(--shadow-sm)",
};

