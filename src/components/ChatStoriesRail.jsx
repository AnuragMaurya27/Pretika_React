import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquareText, ChevronRight, Clock3 } from "lucide-react";
import { useChatStories } from "../lib/hooks";
import Img from "./Img";
import Tilt from "./Tilt";
import { compact } from "../lib/format";

/**
 * Home rail for Pretika Chats — identical Section shape AND card footprint as
 * every other Home rail (StoryCard: 150–190px wide, 0.68 poster + text below),
 * but the poster is a miniature haunted phone-chat instead of cover art.
 * Self-fetching; renders nothing until at least one published chat story exists.
 */
export default function ChatStoriesRail() {
  const nav = useNavigate();
  const { data, isLoading } = useChatStories({ page_size: 10 });
  const items = data?.items || [];
  if (isLoading || items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ marginTop: 30 }}
    >
      <div className="container sec-head" style={{ marginBottom: 12 }}>
        <div className="row gap-8 section-title">
          <MessageSquareText size={18} color="var(--indigo-600)" /> Pretika Chats
        </div>
        <div className="sec-rule" />
        <Link to="/chat-stories" className="see-all">
          Sab dekho <ChevronRight size={16} />
        </Link>
      </div>

      <div className="container">
        <div className="hscroll" style={{ paddingBottom: 6 }}>
          {items.map((s, i) => (
            <ChatStoryCard key={s.id} story={s} index={i} onOpen={() => nav(`/chat-stories/${s.slug}`)} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* Poster card — StoryCard ka exact footprint, andar mini chat scene */
function ChatStoryCard({ story: s, index = 0, onOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
      whileTap={{ scale: 0.98 }}
      // Fixed 150px so a short chat rail matches the dense category rails
      // (StoryCard would balloon to its 190px maxWidth with only a few items).
      style={{ width: 150, flexShrink: 0 }}
    >
      <button onClick={onOpen} style={{ display: "block", width: "100%", textAlign: "left" }}>
        <Tilt max={11} scale={1.05} style={poster}>
          <span style={ember} aria-hidden="true" />
          {/* mini chat header */}
          <span style={miniHead}>
            <Img path={s.contact_avatar} seed={s.contact_name} kind="avatar" alt=""
              style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            <span style={{ minWidth: 0 }}>
              <span className="clamp-1" style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: "#1f1a14", lineHeight: 1.25 }}>
                {s.contact_name}
              </span>
              <span style={{ fontSize: 8.5, color: "#128c4a", fontWeight: 600 }}>online</span>
            </span>
          </span>
          {/* mini conversation */}
          <span style={miniBody}>
            <span className="clamp-3" style={miniBubble}>{s.preview_text || "…"}</span>
            <span style={miniTyping} aria-hidden="true">
              <span style={dot} /><span style={{ ...dot, opacity: 0.7 }} /><span style={{ ...dot, opacity: 0.45 }} />
            </span>
          </span>
          {/* bottom bar — same anatomy as StoryCard's parts bar */}
          <span style={chatBar}>
            <Clock3 size={12} color="#fff" />
            <span className="clamp-1" style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>
              {s.duration_minutes} min ka darr
            </span>
          </span>
        </Tilt>
        <span style={{ display: "block", paddingTop: 8 }}>
          {/* no inline display here — it would override clamp-1's -webkit-box
              and let the title wrap to 2 lines (StoryCard keeps it to 1) */}
          <span className="clamp-1" style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.2, color: "var(--text-primary)" }}>
            {s.title}
          </span>
          <span style={chatBadge}>Chat Story</span>
          <span className="tertiary" style={{ display: "block", fontSize: 11, marginTop: 4 }}>
            {compact(s.total_views)} baar padhi gayi
          </span>
        </span>
      </button>
    </motion.div>
  );
}

/* same footprint/shadow as StoryCard's poster, parchment-horror interior */
const poster = {
  position: "relative", aspectRatio: "0.68", borderRadius: 16, overflow: "hidden",
  display: "flex", flexDirection: "column",
  background:
    "radial-gradient(70% 40% at 100% 0%, rgba(156,28,20,.12), transparent 70%), radial-gradient(60% 35% at 0% 100%, rgba(110,15,10,.13), transparent 70%), #ebe1cd",
  border: "1px solid var(--indigo-100)",
  boxShadow: "0 6px 16px rgba(40,20,12,.16), 0 18px 40px rgba(40,20,12,.14)",
};
const ember = {
  position: "absolute", top: 0, left: 0, right: 0, height: 2.5, zIndex: 2,
  background: "linear-gradient(90deg, transparent, var(--crimson-mid) 30%, var(--crimson) 50%, var(--crimson-mid) 70%, transparent)",
};
const miniHead = {
  display: "flex", alignItems: "center", gap: 6, padding: "9px 9px 7px",
  background: "#f6f1e4", borderBottom: "1px solid rgba(120,100,80,.16)", flexShrink: 0,
};
const miniBody = { flex: 1, display: "flex", flexDirection: "column", gap: 6, padding: "10px 9px", minHeight: 0 };
const miniBubble = {
  alignSelf: "flex-start", maxWidth: "92%", padding: "6px 8px",
  borderRadius: 9, borderTopLeftRadius: 3, background: "#fffdf7",
  boxShadow: "0 1px 1.5px rgba(60,40,20,.22)",
  color: "#1f1a14", fontSize: 10.5, lineHeight: 1.45,
};
const miniTyping = {
  alignSelf: "flex-start", display: "inline-flex", gap: 3, padding: "8px 9px",
  borderRadius: 9, borderTopLeftRadius: 3, background: "#fffdf7",
  boxShadow: "0 1px 1.5px rgba(60,40,20,.22)",
};
const dot = { width: 4.5, height: 4.5, borderRadius: "50%", background: "#9a8e79", display: "inline-block" };
const chatBar = {
  display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", flexShrink: 0,
  background: "rgba(156,28,20,.92)",
};
const chatBadge = {
  display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: 20,
  background: "#fff0f0", border: "1px solid rgba(204,0,0,.18)", color: "var(--crimson)",
  fontSize: 10, fontWeight: 500,
};
