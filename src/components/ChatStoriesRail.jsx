import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquareText, ChevronRight, Clock3, MoreVertical, ArrowRight } from "lucide-react";
import { useChatStories } from "../lib/hooks";
import Img from "./Img";
import Tilt from "./Tilt";
import { compact } from "../lib/format";
import { IS_TOUCH } from "../lib/device";

/**
 * Home rail for Pretika Chats. Each card is a tiny, *living* messaging screen:
 * an online contact, an unread horror line, a timestamp from the dead of night
 * and a typing indicator that never stops — the story is mid-conversation and
 * you're being pulled in. Self-fetching; renders nothing until ≥1 chat exists.
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
      <div className="container sec-head" style={{ marginBottom: 6 }}>
        <div className="row gap-8 section-title">
          <MessageSquareText size={18} color="var(--indigo-600)" /> Pretika Chats
        </div>
        <div className="sec-rule" />
        <Link to="/chat-stories" className="see-all">
          Sab dekho <ChevronRight size={16} />
        </Link>
      </div>
      <div className="container">
        <p className="pchat-eyebrow">Ek chat jo raat ke andhere mein shuru hoti hai — aur aapko andar khinch leti hai.</p>
        <div className="hscroll" style={{ paddingBottom: 6 }}>
          {items.map((s, i) => (
            <ChatStoryCard key={s.id} story={s} index={i} onOpen={() => nav(`/chat-stories/${s.slug}`)} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// Deterministic dead-of-night timestamps — stable per card, all deeply cursed.
const NIGHT_TIMES = ["2:47 AM", "3:03 AM", "1:59 AM", "3:33 AM", "2:14 AM", "4:04 AM", "3:17 AM"];

/* Poster card — a mini live chat screen, then title + meta below. */
function ChatStoryCard({ story: s, index = 0, onOpen }) {
  const time = NIGHT_TIMES[index % NIGHT_TIMES.length];
  return (
    <motion.div
      className="pchat-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
      // Tap-scale only on desktop — on touch it shakes the card under the finger
      // mid-scroll and fights the native scroll (matches StoryCard).
      whileTap={IS_TOUCH ? undefined : { scale: 0.98 }}
    >
      <button onClick={onOpen} style={{ display: "block", width: "100%", textAlign: "left" }}>
        <Tilt max={10} scale={1.04} className="pchat-phone">
          {/* chat app header — avatar with a live online dot, name, "typing…" */}
          <div className="pchat-head">
            <span className="pchat-av">
              <Img path={s.contact_avatar} seed={s.contact_name} kind="avatar" alt="" />
              <span className="pchat-dot" aria-hidden="true" />
            </span>
            <span className="pchat-meta">
              <span className="pchat-name clamp-1">{s.contact_name}</span>
              <span className="pchat-status is-typing">typing…</span>
            </span>
            <MoreVertical size={14} className="pchat-kebab" aria-hidden="true" />
          </div>

          {/* the conversation — the hook line, a 3 AM stamp, then a live typing bubble */}
          <div className="pchat-body">
            <span className="pchat-bubble clamp-3">{s.preview_text || "…"}</span>
            <span className="pchat-time">{time}</span>
            <span className="pchat-typing" aria-hidden="true"><i /><i /><i /></span>
          </div>

          {/* duration bar — same anatomy as the story poster's parts bar */}
          <div className="pchat-foot">
            <Clock3 size={12} color="#fff" />
            <b className="clamp-1">{s.duration_minutes} min ka darr</b>
            <span className="pchat-arrow"><ArrowRight size={13} color="#fff" /></span>
          </div>
        </Tilt>

        {/* caption below the phone */}
        <span style={{ display: "block", paddingTop: 9 }}>
          <span className="pchat-title clamp-1">{s.title}</span>
          <span className="pchat-sub">
            <span className="pchat-tag"><MessageSquareText size={10} /> Chat Story</span>
            <span className="pchat-views">{compact(s.total_views)} padhi gayi</span>
          </span>
        </span>
      </button>
    </motion.div>
  );
}
