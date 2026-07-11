import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquareText, ChevronRight, Clock3, ArrowRight, Eye, Users, MoonStar,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatStories } from "../lib/hooks";
import Img from "./Img";
import Tilt from "./Tilt";
import { compact } from "../lib/format";
import { interleaveChatTypes } from "../lib/content";
import { IS_TOUCH } from "../lib/device";

/**
 * Home band for Pretika Chats — light "haunted messenger" deck.
 * A blush parchment band (chat-wallpaper doodles + crimson hairlines) breaks
 * the home rhythm without leaving daylight. Group aur single chats interleave
 * hoti hain — group cards get an overlapping avatar cluster + GROUP tag,
 * singles get a big gradient-ring avatar with a live online dot. Har card ek
 * chhota sa "abhi-abhi aaya message" hai: preview bubble, typing dots, and a
 * dead-of-night timestamp. Self-fetching; renders nothing until ≥1 chat.
 */
export default function ChatStoriesRail() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { data, isLoading } = useChatStories({ page_size: 10 });
  const items = interleaveChatTypes(data?.items || []);
  if (isLoading || items.length === 0) return null;

  return (
    <motion.section
      className="pcs"
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container pcs-head">
        <div className="pcs-id">
          <span className="pcs-appic" aria-hidden="true">
            <MessageSquareText size={22} strokeWidth={2.2} />
            <i className="pcs-appdot">{items.length > 9 ? "9+" : items.length}</i>
          </span>
          <div>
            <div className="pcs-title">{t("chats.titleA")} {t("chats.titleB")}</div>
            <div className="pcs-sub">{t("chats.railSub")}</div>
          </div>
        </div>
        <Link to="/chat-stories" className="pcs-all">
          {t("chats.seeAll")} <ChevronRight size={15} />
        </Link>
      </div>

      <div className="container">
        <div className="hscroll pcs-rail">
          {items.map((s, i) => (
            <ChatCard key={s.id} story={s} index={i} onOpen={() => nav(`/chat-stories/${s.slug}`)} />
          ))}
          <Link to="/chat-stories" className="pcc-end">
            <span className="pcc-end-ic"><MessageSquareText size={22} /></span>
            <b>{t("chats.allChats")}</b>
            <span>{t("chats.openInbox")}</span>
            <span className="pcc-end-arrow"><ArrowRight size={15} /></span>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

// Deterministic dead-of-night timestamps — stable per card, all deeply cursed.
const NIGHT_TIMES = ["3:33 AM", "2:47 AM", "1:59 AM", "4:04 AM", "3:13 AM", "2:22 AM", "3:41 AM"];

/* One chat = one light "message card". Groups: overlapping avatar cluster +
   GROUP tag + unread count. Singles: gradient-ring avatar + online pulse. */
function ChatCard({ story: s, index = 0, onOpen }) {
  const { t } = useTranslation();
  const time = NIGHT_TIMES[index % NIGHT_TIMES.length];
  const isGroup = s.chat_type === "group";
  return (
    <motion.div
      className="pcc"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
      // Tap-scale only on desktop — on touch it shakes the card under the finger
      // mid-scroll and fights the native scroll (matches StoryCard).
      whileTap={IS_TOUCH ? undefined : { scale: 0.98 }}
    >
      <button onClick={onOpen} style={{ display: "block", width: "100%", textAlign: "left" }}>
        <Tilt max={8} scale={1.03} className={`pcc-box ${isGroup ? "is-group" : ""}`}>
          {isGroup && (
            <span className="pcc-type"><Users size={9} /> {t("chats.group")}</span>
          )}

          {/* identity — cluster for groups, ringed avatar for singles */}
          {isGroup ? (
            <span className="pcc-cluster" aria-hidden="true">
              <span className="pcc-cav"><Img path={s.contact_avatar} seed={s.contact_name} kind="avatar" alt="" /></span>
              <span className="pcc-cav"><Img seed={`${s.contact_name} do`} kind="avatar" alt="" /></span>
              <span className="pcc-cav"><Img seed={`${s.contact_name} teen`} kind="avatar" alt="" /></span>
            </span>
          ) : (
            <span className="pcc-ring" aria-hidden="true">
              <span className="pcc-ringin">
                <Img path={s.contact_avatar} seed={s.contact_name} kind="avatar" alt="" />
              </span>
              <i className="pcc-on" />
            </span>
          )}

          <span className="pcc-name clamp-1">{s.contact_name}</span>
          {isGroup ? (
            <span className="pcc-status is-unread">{t("chats.newMessages", { n: s.message_count })}</span>
          ) : (
            <span className="pcc-status is-online">{t("chats.online")}</span>
          )}

          {/* the hook line, straight from the chat — clamp lives on an inner
              span: line-clamp on the padded bubble leaks the cut line into
              the bottom padding */}
          <span className="pcc-bubble"><span className="clamp-3">{s.preview_text || "…"}</span></span>

          {/* still typing… at a time nobody should be awake */}
          <span className="pcc-foot">
            <span className="pcc-typing" aria-hidden="true"><i /><i /><i /></span>
            <span className="pcc-time"><MoonStar size={10} /> {time}</span>
          </span>
        </Tilt>

        {/* caption below the card */}
        <span className="pcc-cap">
          <span className="pcc-captitle clamp-1">{s.title}</span>
          <span className="pcc-capmeta">
            <span className="pcc-chip"><Clock3 size={10} /> {t("chats.minFear", { n: s.duration_minutes })}</span>
            <span className="pcc-views"><Eye size={11} /> {compact(s.total_views)}</span>
          </span>
        </span>
      </button>
    </motion.div>
  );
}
