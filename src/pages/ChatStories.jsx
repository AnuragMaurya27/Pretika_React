import { useNavigate } from "react-router-dom";
import {
  MessageSquareText, Plus, Pencil, Trash2, Eye, Clock3, Check, Search,
  Archive, MoonStar, Flame,
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

/**
 * Pretika Chats — browse page. Cinematic hero (fog + torn-paper edge) over a
 * light "haunted WhatsApp" inbox: the anatomy of a real messenger chat-list —
 * search pill, hairline dividers, unread badges, archived row — re-skinned in
 * the Daylight Horror parchment + crimson palette. The official Pretika
 * account additionally sees drafts + edit/delete + new-story CTA.
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

  const items = (isOfficial ? mine.data?.items : pub.data?.items) || [];
  const loading = isOfficial ? mine.isLoading : pub.isLoading;
  const totalViews = items.reduce((n, s) => n + (s.total_views || 0), 0);

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
        {/* ── cinematic hero: fog, blood glow, torn-paper edge ── */}
        <div className="chtl-hero">
          <div className="fog" />
          <div className="chtl-hero-in">
            <span className="chtl-hero-badge">
              <MessageSquareText size={14} /> PRETIKA ORIGINALS
            </span>
            <h1 className="chtl-hero-title display-hi lang-hi">
              प्रेतिका <span className="flicker">चैट्स</span>
            </h1>
            <p className="chtl-hero-sub">
              Kisi aur ka phone. Kisi aur ki raat. Har chat ek sachchi lagne
              wali darawni kahani — message-by-message, jaise tum khud scroll
              kar rahe ho.
            </p>

            <div className="chtl-hero-stats">
              <span className="chtl-stat">
                <MessageSquareText size={13} /> {items.length || "…"} {items.length === 1 ? "chat" : "chats"}
              </span>
              {totalViews > 0 && (
                <span className="chtl-stat">
                  <Flame size={13} /> {totalViews} baar padhi gayi
                </span>
              )}
              <span className="chtl-stat blood">
                <MoonStar size={13} /> Raat 12 baje ke baad mat kholna
              </span>
            </div>

            {isOfficial && (
              <div className="chtl-hero-stats" style={{ marginTop: 14 }}>
                <button className="btn btn-sm btn-crimson" onClick={() => nav("/creator/chat-story/new")}>
                  <Plus size={15} /> Nai Chat Story
                </button>
              </div>
            )}
          </div>
          <div className="chtl-hero-tear" aria-hidden="true" />
        </div>

        {/* ── the haunted inbox (WhatsApp-light anatomy, parchment skin) ── */}
        <div className="container">
          <div className="chtl-panel">
            <div className="chtl-panel-head">
              <span className="chtl-panel-title">Chats</span>
              {items.length > 0 && (
                <span className="chtl-unread-note">
                  {items.length} unread {items.length === 1 ? "raat" : "raatein"}
                </span>
              )}
            </div>

            <div className="chtl-search" aria-hidden="true">
              <Search size={15} />
              Dhoondo… ya mat dhoondo
            </div>

            {loading ? (
              <div style={{ padding: "8px 16px 18px", display: "grid", gap: 14 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="row gap-12">
                    <SkeletonBox w={50} h={50} r={25} />
                    <div style={{ flex: 1, display: "grid", gap: 6 }}>
                      <SkeletonBox w="55%" h={13} r={6} />
                      <SkeletonBox w="80%" h={11} r={6} />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="center" style={{ padding: "34px 24px 38px" }}>
                <Spook size={68} tone="light" />
                <div style={{ fontWeight: 800, fontSize: 16, marginTop: 14 }}>
                  Abhi koi chat nahi aayi
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 5, lineHeight: 1.6 }}>
                  Pretika ka phone abhi shaant hai… jaldi hi pehli chat aayegi.
                </div>
              </div>
            ) : (
              items.map((s) => (
                <button key={s.id} className="chtl-row" onClick={() => nav(`/chat-stories/${s.slug}`)}>
                  <Img
                    path={s.contact_avatar}
                    seed={s.contact_name}
                    kind="avatar"
                    alt=""
                    className="chtl-row-avatar"
                  />
                  <span className="chtl-row-mid">
                    <span className="row gap-8">
                      <span className="chtl-row-name clamp-1">{s.title}</span>
                      {s.status === "draft" && (
                        <span className="badge badge-gold" style={{ flexShrink: 0 }}>DRAFT</span>
                      )}
                    </span>
                    <span className="chtl-row-preview">
                      <Check size={14} color="var(--indigo-400)" style={{ flexShrink: 0 }} />
                      <span className="clamp-1">
                        {s.contact_name}: {s.preview_text || "…"}
                      </span>
                    </span>
                  </span>
                  <span className="chtl-row-right">
                    <span className="chtl-row-time">
                      <Clock3 size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                      {s.duration_minutes} min
                    </span>
                    <span className="row gap-6">
                      {isOfficial && (
                        <span className="chtl-row-actions">
                          <span
                            className="chtl-action"
                            role="button"
                            tabIndex={0}
                            aria-label="Edit"
                            onClick={(e) => { e.stopPropagation(); nav(`/creator/chat-story/${s.id}/edit`); }}
                            onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), nav(`/creator/chat-story/${s.id}/edit`))}
                          >
                            <Pencil size={14} />
                          </span>
                          <span
                            className="chtl-action"
                            role="button"
                            tabIndex={0}
                            aria-label="Delete"
                            onClick={(e) => onDelete(e, s)}
                            onKeyDown={(e) => e.key === "Enter" && onDelete(e, s)}
                          >
                            <Trash2 size={14} />
                          </span>
                        </span>
                      )}
                      <span className="chtl-badge">{s.message_count}</span>
                    </span>
                  </span>
                </button>
              ))
            )}

            {/* archived easter egg → schema demo chat */}
            <button className="chtl-archived" onClick={() => nav("/chat-stories/demo")}>
              <span className="chtl-archived-ic"><Archive size={19} /></span>
              <span style={{ flex: 1 }}>Archived</span>
              <span style={{ fontSize: 12.5, color: "var(--crimson-mid)", fontWeight: 700 }}>1</span>
            </button>

            <div className="chtl-panel-foot">
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
