import { useNavigate } from "react-router-dom";
import {
  MessageSquareText, Plus, Pencil, Trash2, Eye, Clock3, Search,
  Archive, MoonStar, Flame, ChevronRight, SquarePen, Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../store/auth";
import {
  useChatStories, useMyChatStories, useCanPublishChatStories, useDeleteChatStory,
} from "../lib/hooks";
import { errMsg } from "../lib/api";
import Seo from "../components/Seo";
import Img from "../components/Img";
import { Spook } from "../components/Art";
import { SkeletonBox } from "../components/Skeleton";
import { interleaveChatTypes } from "../lib/content";

// Deterministic dead-of-night timestamps — stable per row, all deeply cursed.
const NIGHT_TIMES = ["3:33 AM", "2:47 AM", "1:59 AM", "4:04 AM", "3:13 AM", "2:22 AM", "3:41 AM"];

/**
 * Pretika Chats — browse page, light "haunted messages" edition. A parchment
 * hero (red mist, ink Devanagari title) floats over a bone-white messages app:
 * a pinned rail of gradient-ring contacts up top, then the inbox — group chats
 * with overlapping avatar clusters, singles with a lone ringed face, glowing
 * unread dots and 3 AM timestamps. Group ↔ single rows interleave for variety.
 * The official Pretika account additionally sees drafts + edit/delete + compose.
 */
export default function ChatStories() {
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  // client-side hint only — the server enforces the real gate
  const maybeOfficial = user?.username?.toLowerCase() === "pretika";
  const canPublish = useCanPublishChatStories(maybeOfficial);
  const isOfficial = maybeOfficial && canPublish.data === true;

  const pub = useChatStories({ page_size: 50 });
  const mine = useMyChatStories(isOfficial);
  const del = useDeleteChatStory();

  const items = interleaveChatTypes((isOfficial ? mine.data?.items : pub.data?.items) || []);
  const loading = isOfficial ? mine.isLoading : pub.isLoading;
  const totalViews = items.reduce((n, s) => n + (s.total_views || 0), 0);
  const pins = items.slice(0, 6);

  const onDelete = (e, s) => {
    e.stopPropagation();
    if (!window.confirm(`"${s.title}" delete karein? Wapas nahi aayegi.`)) return;
    del.mutate(s.id, {
      onSuccess: () => toast.success("Chat story delete ho gayi"),
      onError: (err) => toast.error(errMsg(err)),
    });
  };

  return (
    <div className="page">
      <Seo
        title="Pretika Chats — Chat wali Darawni Kahaniyan"
        description="Kisi aur ka phone, kisi aur ki raat. Pretika Chats — WhatsApp jaisi chat me likhi found-footage Hindi horror stories. Har chat, 10 minute ka khauf."
        path="/chat-stories"
      />
      <div className="page-scroll">
        {/* ── light hero: parchment + red mist + ink title ── */}
        <div className="chp-hero">
          <div className="fog" />
          <div className="chp-hero-in">
            <span className="chp-badge">
              <MessageSquareText size={13} /> PRETIKA ORIGINALS
            </span>
            <h1 className="chp-title display-hi lang-hi">
              प्रेतिका <span className="flicker">चैट्स</span>
            </h1>
            <p className="chp-sub">
              Kisi aur ka phone. Kisi aur ki raat. Har chat ek sachchi lagne
              wali darawni kahani — message-by-message, jaise tum khud scroll
              kar rahe ho.
            </p>

            <div className="chp-stats">
              <span className="chp-stat">
                <MessageSquareText size={13} /> {items.length || "…"} {items.length === 1 ? "chat" : "chats"}
              </span>
              {totalViews > 0 && (
                <span className="chp-stat">
                  <Flame size={13} /> {totalViews} baar padhi gayi
                </span>
              )}
              <span className="chp-stat blood">
                <MoonStar size={13} /> Raat 12 baje ke baad mat kholna
              </span>
            </div>

            {isOfficial && (
              <div className="chp-stats" style={{ marginTop: 14 }}>
                <button className="btn btn-sm btn-crimson" onClick={() => nav("/creator/chat-story/new")}>
                  <Plus size={15} /> Nai Chat Story
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── the inbox: bone-white messages app ── */}
        <div className="container">
          <div className="chp-panel">
            <div className="chp-phead">
              <span className="chp-ptitle">Chats</span>
              {isOfficial ? (
                <button
                  className="chp-compose"
                  aria-label="Nai chat story"
                  onClick={() => nav("/creator/chat-story/new")}
                >
                  <SquarePen size={17} />
                </button>
              ) : items.length > 0 ? (
                <span className="chp-unread">
                  {items.length} unread {items.length === 1 ? "raat" : "raatein"}
                </span>
              ) : null}
            </div>

            <div className="chp-search" aria-hidden="true">
              <Search size={15} />
              Dhoondo… ya mat dhoondo
            </div>

            {/* pinned contacts — aaj raat kaun message kar raha hai */}
            {!loading && pins.length > 0 && (
              <>
                <div className="chp-pins-label">Aaj raat</div>
                <div className="chp-pins">
                  {pins.map((s) => (
                    <button key={s.id} className="chp-pin" onClick={() => nav(`/chat-stories/${s.slug}`)}>
                      <span className="chp-pin-ring">
                        <span className="chp-pin-in">
                          <Img path={s.contact_avatar} seed={s.contact_name} kind="avatar" alt="" />
                        </span>
                        {s.chat_type === "group" && (
                          <i className="chp-pin-badge"><Users size={9} /></i>
                        )}
                      </span>
                      <span className="chp-pin-name clamp-1">{s.contact_name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {loading ? (
              <div style={{ padding: "10px 18px 20px", display: "grid", gap: 16 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="row gap-12">
                    <SkeletonBox w={52} h={52} r={26} />
                    <div style={{ flex: 1, display: "grid", gap: 7 }}>
                      <SkeletonBox w="55%" h={13} r={6} />
                      <SkeletonBox w="82%" h={11} r={6} />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="center" style={{ padding: "36px 24px 40px" }}>
                <Spook size={68} tone="light" />
                <div style={{ fontWeight: 800, fontSize: 16, marginTop: 14 }}>
                  Abhi koi chat nahi aayi
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 5, lineHeight: 1.6 }}>
                  Pretika ka phone abhi shaant hai… jaldi hi pehli chat aayegi.
                </div>
              </div>
            ) : (
              items.map((s, i) => (
                <button key={s.id} className="chp-row" onClick={() => nav(`/chat-stories/${s.slug}`)}>
                  <span className="chp-dot" aria-hidden="true" />
                  {s.chat_type === "group" ? (
                    <span className="chp-avg" aria-hidden="true">
                      <span><Img path={s.contact_avatar} seed={s.contact_name} kind="avatar" alt="" /></span>
                      <span><Img seed={`${s.contact_name} do`} kind="avatar" alt="" /></span>
                    </span>
                  ) : (
                    <Img
                      path={s.contact_avatar}
                      seed={s.contact_name}
                      kind="avatar"
                      alt=""
                      className="chp-av"
                    />
                  )}
                  <span className="chp-mid">
                    <span className="chp-toprow">
                      <span className="chp-name clamp-1">{s.title}</span>
                      {s.status === "draft" && <span className="chp-draft">DRAFT</span>}
                      <span className="chp-when">
                        {NIGHT_TIMES[i % NIGHT_TIMES.length]}
                        <ChevronRight size={13} />
                      </span>
                    </span>
                    <span className="chp-prev clamp-1">
                      {s.contact_name}: {s.preview_text || "…"}
                    </span>
                    <span className="chp-metaline">
                      <span className="chp-meta-it"><Clock3 size={11} /> {s.duration_minutes} min ka darr</span>
                      <i className="chp-sep" />
                      <span className="chp-meta-it">{s.message_count} messages</span>
                      {s.chat_type === "group" && (
                        <span className="chp-gtag"><Users size={10} /> group</span>
                      )}
                      {isOfficial && (
                        <span className="chp-actions">
                          <span
                            className="chp-action"
                            role="button"
                            tabIndex={0}
                            aria-label="Edit"
                            onClick={(e) => { e.stopPropagation(); nav(`/creator/chat-story/${s.id}/edit`); }}
                            onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), nav(`/creator/chat-story/${s.id}/edit`))}
                          >
                            <Pencil size={13} />
                          </span>
                          <span
                            className="chp-action danger"
                            role="button"
                            tabIndex={0}
                            aria-label="Delete"
                            onClick={(e) => onDelete(e, s)}
                            onKeyDown={(e) => e.key === "Enter" && onDelete(e, s)}
                          >
                            <Trash2 size={13} />
                          </span>
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}

            {/* archived easter egg → schema demo chat */}
            <button className="chp-arch" onClick={() => nav("/chat-stories/demo")}>
              <span className="chp-arch-ic"><Archive size={18} /></span>
              <span style={{ flex: 1 }}>Archived</span>
              <span className="chp-arch-n">1</span>
            </button>

            <div className="chp-pfoot">
              <span className="row gap-6" style={{ justifyContent: "center" }}>
                <Eye size={12} />
                Headphones laga lo. Lights bujha do. Ab taiyaar ho.
              </span>
            </div>
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
