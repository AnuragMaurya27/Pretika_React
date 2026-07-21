import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageCircle, LogIn } from "lucide-react";
import { usePrivateChats, useIsMobile } from "../lib/chat";
import { useAuth } from "../store/auth";
import Img from "../components/Img";
import Seo from "../components/Seo";
import EmptyState from "../components/EmptyState";
import ChatMobileGate from "../components/ChatMobileGate";
import { SkeletonBox } from "../components/Skeleton";
import { timeAgo } from "../lib/format";

function previewText(m, meId, t) {
  if (!m) return "";
  let body;
  if (m.is_deleted) body = "—";
  else if (m.message_type === "story") body = t("chat.sharedStory");
  else if (m.message_type === "image") body = t("chat.photo");
  else body = m.content || "";
  return meId && m.sender_id === meId ? `${t("chat.you")}: ${body}` : body;
}

function ChatRow({ room, onClick, meId, t }) {
  const name = room.other_username || "";
  return (
    <button className="chat-row" onClick={onClick}>
      <Img path={room.other_avatar_url} seed={name} kind="avatar" alt={name} className="chat-row-av" />
      <span className="chat-row-main">
        <span className="chat-row-top">
          <span className="chat-row-name clamp-1">{name}</span>
          {room.last_message_at && <span className="chat-row-time">{timeAgo(room.last_message_at)}</span>}
        </span>
        <span className="chat-row-bottom">
          <span className="chat-row-prev clamp-1">{previewText(room.last_message, meId, t)}</span>
          {room.unread_count > 0 && <span className="chat-unread">{room.unread_count}</span>}
        </span>
      </span>
    </button>
  );
}

export default function ChatInbox() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const isMobile = useIsMobile();
  const authed = useAuth((s) => s.isAuthed)();
  const me = useAuth((s) => s.user);
  const [tab, setTab] = useState("general");
  const { data, isLoading } = usePrivateChats();

  const { general, requests } = useMemo(() => {
    const rooms = Array.isArray(data) ? data : [];
    return {
      general: rooms.filter((r) => !r.is_request),
      requests: rooms.filter((r) => r.is_request),
    };
  }, [data]);

  // Bigger screens (laptop / iPad / TV) → "open on mobile", never the inbox.
  if (!isMobile) {
    return <div className="page"><Seo title={t("chat.title")} robots="noindex, nofollow" /><ChatMobileGate /></div>;
  }

  if (!authed) {
    return (
      <div className="page">
        <Seo title={t("chat.title")} robots="noindex, nofollow" />
        <div className="chat-gate">
          <div className="chat-gate-icon"><MessageCircle size={32} /></div>
          <p style={{ color: "var(--text-tertiary)" }}>{t("chat.loginToChat")}</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 10 }}>
            <LogIn size={16} /> {t("auth.login")}
          </Link>
        </div>
      </div>
    );
  }

  const list = tab === "general" ? general : requests;

  return (
    <div className="page">
      <Seo title={t("chat.title")} robots="noindex, nofollow" />
      <div className="page-scroll">
        <div className="chat-inbox-head">
          <h1 className="serif" style={{ fontSize: 24, fontWeight: 800 }}>{t("chat.title")}</h1>
        </div>

        <div className="chat-tabs">
          <button className={tab === "general" ? "on" : ""} onClick={() => setTab("general")}>
            {t("chat.general")}
          </button>
          <button className={tab === "requests" ? "on" : ""} onClick={() => setTab("requests")}>
            {t("chat.requests")}
            {requests.length > 0 && <span className="chat-tab-badge">{requests.length}</span>}
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: "8px 14px", display: "grid", gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonBox key={i} h={62} r={14} />)}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={30} />}
            title={tab === "requests" ? t("chat.noRequests") : t("chat.empty")}
            sub={tab === "requests" ? "" : t("chat.emptySub")}
          />
        ) : (
          <div className="chat-list">
            {list.map((r) => (
              <ChatRow key={r.id} room={r} meId={me?.id} t={t} onClick={() => nav(`/chat/${r.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
