import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, UserCheck, Compass } from "lucide-react";
import { useFeed, useFollowingFeed } from "../lib/hooks";
import { useAuth } from "../store/auth";
import { StoryCard } from "./StoryCard";
import { SkeletonBox } from "./Skeleton";

/*
  The logged-in Home body: a YouTube-style vertical feed with two surfaces —
  "For You" (the personalized /api/feed ranker: followed + discovery + fresh,
  blended) and "Following" (pure chronological from creators you follow). Both
  infinite-scroll. The server does all ranking; this just renders StoryCards in
  a responsive grid and shows a subtle reason chip on the meaningful picks.
*/
export default function ForYouFeed() {
  const { t } = useTranslation();
  const authed = useAuth((s) => s.isAuthed)();
  const [tab, setTab] = useState("for_you");

  return (
    <section className="container" style={{ marginTop: 24 }}>
      <div className="row" style={{ gap: 8, marginBottom: 16 }}>
        <button className={tab === "for_you" ? "chip active" : "chip"} onClick={() => setTab("for_you")} style={tabBtn}>
          <Sparkles size={15} /> {t("feed.forYou")}
        </button>
        {authed && (
          <button className={tab === "following" ? "chip active" : "chip"} onClick={() => setTab("following")} style={tabBtn}>
            <UserCheck size={15} /> {t("feed.following")}
          </button>
        )}
      </div>

      {tab === "for_you" ? <ForYouList /> : <FollowingList />}
    </section>
  );
}

function ForYouList() {
  const { t } = useTranslation();
  const q = useFeed(12);
  return <FeedGrid q={q} showReasons emptyTitle={t("feed.emptyForYouTitle")} emptySub={t("feed.emptyForYouSub")} />;
}

function FollowingList() {
  const { t } = useTranslation();
  const q = useFollowingFeed(12);
  return (
    <FeedGrid q={q} emptyTitle={t("feed.emptyFollowingTitle")} emptySub={t("feed.emptyFollowingSub")} emptyCta />
  );
}

function FeedGrid({ q, showReasons = false, emptyTitle, emptySub, emptyCta = false }) {
  const { t } = useTranslation();
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = q;
  const items = useMemo(() => (data?.pages || []).flatMap((p) => p?.items || []), [data]);

  // Infinite scroll — a sentinel below the grid pulls the next page well before
  // it enters view (rootMargin) so scrolling feels seamless.
  const sentinel = useRef(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "700px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <GridSkeleton />;
  if (!items.length) return <FeedEmpty title={emptyTitle} sub={emptySub} cta={emptyCta} />;

  return (
    <>
      <div style={grid}>
        {items.map((s) => (
          <div key={s.id} style={{ position: "relative" }}>
            {showReasons && <ReasonChip reason={s.feed_reason} />}
            <StoryCard story={s} />
          </div>
        ))}
      </div>
      <div ref={sentinel} style={{ height: 1 }} />
      {isFetchingNextPage && <GridSkeleton rows={1} />}
      {!hasNextPage && items.length > 6 && (
        <div className="tertiary" style={{ textAlign: "center", padding: "26px 0 6px", fontSize: 12.5 }}>
          {t("feed.end")}
        </div>
      )}
    </>
  );
}

// Subtle overlay chip — only on the two picks the reader actually cares about:
// stories from creators they follow, and brand-new creators getting their shot.
function ReasonChip({ reason }) {
  const { t } = useTranslation();
  if (reason === "following")
    return <span style={chip}><UserCheck size={11} /> {t("feed.reasonFollowing")}</span>;
  if (reason === "new_creator")
    return <span style={{ ...chip, background: "rgba(156,28,20,.92)" }}><Sparkles size={11} /> {t("feed.reasonNew")}</span>;
  return null;
}

function GridSkeleton({ rows = 2 }) {
  return (
    <div style={grid}>
      {Array.from({ length: rows * 4 }).map((_, i) => (
        <SkeletonBox key={i} w="100%" h={212} r={16} />
      ))}
    </div>
  );
}

function FeedEmpty({ title, sub, cta }) {
  const { t } = useTranslation();
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ display: "inline-flex", padding: 16, borderRadius: 20, background: "var(--indigo-50)", marginBottom: 14 }}>
        <Compass size={28} color="var(--indigo-600)" />
      </div>
      <div className="display" style={{ fontSize: 19, fontWeight: 700 }}>{title}</div>
      <p className="muted" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>{sub}</p>
      {cta && (
        <Link to="/explore" className="btn btn-primary" style={{ marginTop: 18, display: "inline-flex" }}>
          {t("feed.exploreCreators")}
        </Link>
      )}
    </div>
  );
}

const tabBtn = { height: 38, fontSize: 13.5, fontWeight: 700 };
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
  gap: 18,
  alignItems: "start",
};
const chip = {
  position: "absolute", top: 8, left: 8, zIndex: 3,
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700,
  background: "rgba(0,0,0,.6)", color: "#fff", pointerEvents: "none",
};
