import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Star, BadgeCheck, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import Img from "./Img";
import Tilt from "./Tilt";
import { compact } from "../lib/format";
import { IS_TOUCH } from "../lib/device";
import { categoryLabel } from "../lib/categories";

/* Poster card — mirrors the Flutter app's StoryCard (0.68 ratio, badges, parts bar) */
export function StoryCard({ story, index = 0, rank }) {
  const { t } = useTranslation();
  const parts =
    story.story_type === "single"
      ? t("card.part")
      : t("card.episodes", { n: Math.max(story.total_episodes || 0, 1) });

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
      // Tap-scale only where there's a real cursor. On touch it fires on the
      // press that begins a scroll → card shakes under the finger and scroll janks.
      whileTap={IS_TOUCH ? undefined : { scale: 0.98 }}
      style={{ minWidth: 150, width: "100%", maxWidth: 190 }}
    >
      <Link to={`/story/${story.slug}`} style={{ display: "block" }}>
        <div style={{ position: "relative" }}>
          {rank != null && (
            <span className="display" style={rankNum}>{rank}</span>
          )}
          <Tilt max={11} scale={1.05} style={poster}>
            <Img path={story.thumbnail_url} seed={story.id} alt={story.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {/* rating */}
            {story.average_rating > 0 && (
              <span style={ratingBadge}>
                <Star size={11} fill="#FFD600" color="#FFD600" /> {story.average_rating.toFixed(1)}
              </span>
            )}
            {/* parts bar */}
            <div style={{ ...partsBar, background: story.is_editor_pick ? "rgba(156,28,20,.92)" : "rgba(0,0,0,.52)" }}>
              <BookOpen size={13} color="#fff" />
              <span className="clamp-1" style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{parts}</span>
            </div>
          </Tilt>
        </div>
        <div style={{ paddingTop: 8 }}>
          <div className="clamp-1" style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.2 }}>{story.title}</div>
          {story.category_name && (
            <span style={catBadge}>{categoryLabel(story.category_name)}</span>
          )}
          <div className="tertiary" style={{ fontSize: 11, marginTop: 4 }}>
            {t("card.reads", { n: compact(story.total_views) })}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* Wide list row — used in search / lists / bookmarks */
export function StoryRow({ story, index = 0 }) {
  useTranslation(); // subscribe to language changes (categoryLabel below)
  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.03, 0.25) }}>
      <Link to={`/story/${story.slug}`} className="row gap-12" style={{ padding: "10px 0" }}>
        <div style={{ position: "relative", width: 66, height: 92, flexShrink: 0 }}>
          <Img path={story.thumbnail_url} seed={story.id} alt={story.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="clamp-2" style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.25 }}>{story.title}</div>
          <div className="row gap-4 muted" style={{ fontSize: 12.5, marginTop: 4 }}>
            <span className="clamp-1">{story.creator_display_name || story.creator_username}</span>
            {story.is_verified_creator && <BadgeCheck size={13} color="var(--indigo-600)" />}
          </div>
          <div className="row gap-10 tertiary" style={{ fontSize: 11.5, marginTop: 6 }}>
            <span className="row gap-4"><Eye size={12} /> {compact(story.total_views)}</span>
            {story.average_rating > 0 && <span className="row gap-4"><Star size={12} fill="var(--gold)" color="var(--gold)" /> {story.average_rating.toFixed(1)}</span>}
            {story.category_name && <span style={{ ...catBadge, marginTop: 0 }}>{categoryLabel(story.category_name)}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const poster = {
  position: "relative", aspectRatio: "0.68", borderRadius: 16, overflow: "hidden",
  background: "var(--bg-tertiary)",
  boxShadow: "0 6px 16px rgba(40,20,12,.16), 0 18px 40px rgba(40,20,12,.14)",
};
const ratingBadge = {
  position: "absolute", top: 7, right: 7, display: "inline-flex", alignItems: "center", gap: 3,
  background: "rgba(0,0,0,.62)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 7px", borderRadius: 999,
};
const partsBar = {
  position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", gap: 5,
  padding: "7px 10px",
};
const catBadge = {
  display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: 20,
  background: "#fff0f0", border: "1px solid rgba(204,0,0,.18)", color: "var(--crimson)",
  fontSize: 10, fontWeight: 500,
};
const rankNum = {
  position: "absolute", bottom: 26, left: 2, zIndex: 2, fontSize: 58, fontWeight: 900,
  color: "var(--indigo-600)", lineHeight: 1,
  textShadow: "-2px 0 #fff,2px 0 #fff,0 -2px #fff,0 2px #fff,-2px -2px #fff,2px 2px #fff,-2px 2px #fff,2px -2px #fff,0 4px 6px rgba(0,0,0,.26)",
  pointerEvents: "none",
};
