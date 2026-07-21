import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ArrowLeft, Send, BookOpen, Check, CheckCheck, X } from "lucide-react";
import { get, errMsg } from "../lib/api";
import {
  useChatMessages, useSendMessage, useChatRoomHub, usePrivateChats,
  useAcceptRequest, useDeclineRequest, markRoomRead, useIsMobile,
} from "../lib/chat";
import { useBookmarked } from "../lib/hooks";
import { useAuth } from "../store/auth";
import Img from "../components/Img";
import Seo from "../components/Seo";
import ChatMobileGate from "../components/ChatMobileGate";
import { timeAgo } from "../lib/format";

// SignalR serialises camelCase; REST is snake_case — fold both into one shape.
function nm(m) {
  return {
    id: m.id,
    room_id: m.room_id ?? m.roomId,
    sender_id: m.sender_id ?? m.senderId,
    message_type: m.message_type ?? m.messageType,
    content: m.content ?? null,
    image_url: m.image_url ?? m.imageUrl ?? null,
    shared_story_id: m.shared_story_id ?? m.sharedStoryId ?? null,
    is_deleted: m.is_deleted ?? m.isDeleted ?? false,
    created_at: m.created_at ?? m.createdAt,
  };
}

function Ticks({ mine, seen }) {
  if (!mine) return null;
  return seen
    ? <CheckCheck size={15} className="tick tick-seen" />
    : <Check size={15} className="tick" />;
}

function SharedStoryCard({ storyId }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { data: story } = useQuery({
    queryKey: ["story-meta", storyId],
    queryFn: () => get(`/stories/id/${storyId}`),
    enabled: !!storyId,
    staleTime: 1000 * 60 * 5,
  });
  return (
    <button className="msg-story" onClick={() => story?.slug && nav(`/story/${story.slug}`)}>
      <Img path={story?.thumbnail_url} seed={storyId} alt="" className="msg-story-thumb" />
      <span className="msg-story-info">
        <span className="msg-story-title clamp-2">{story?.title || "…"}</span>
        <span className="msg-story-cta"><BookOpen size={12} /> {t("chat.openStory")}</span>
      </span>
    </button>
  );
}

function StorySharePicker({ open, onClose, onPick }) {
  const { t } = useTranslation();
  const { data } = useBookmarked(open);
  const items = data?.items || (Array.isArray(data) ? data : []);
  if (!open) return null;
  return createPortal(
    <div className="chat-sheet-backdrop" onClick={onClose}>
      <div className="chat-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="chat-sheet-head">
          <span>{t("chat.storyPickerTitle")}</span>
          <button className="chat-sheet-x" onClick={onClose} aria-label="close"><X size={18} /></button>
        </div>
        {items.length === 0 ? (
          <p className="muted" style={{ padding: "18px 4px" }}>{t("chat.storyPickerEmpty")}</p>
        ) : (
          <div className="story-pick-list">
            {items.map((s) => (
              <button key={s.id} className="story-pick" onClick={() => onPick(s)}>
                <Img path={s.thumbnail_url} seed={s.id} alt="" className="story-pick-thumb" />
                <span className="clamp-2" style={{ fontSize: 13.5, fontWeight: 600 }}>{s.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function ChatRoom() {
  const { roomId } = useParams();
  const { t } = useTranslation();
  const nav = useNavigate();
  const isMobile = useIsMobile();
  const me = useAuth((s) => s.user);

  const { data: page } = useChatMessages(roomId);
  const { data: rooms } = usePrivateChats();
  const room = useMemo(
    () => (Array.isArray(rooms) ? rooms.find((r) => r.id === roomId) : null),
    [rooms, roomId]
  );

  const send = useSendMessage(roomId);
  const accept = useAcceptRequest();
  const decline = useDeclineRequest();

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [locallyAccepted, setLocallyAccepted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [live, setLive] = useState([]);              // realtime + optimistic messages
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [liveSeenAt, setLiveSeenAt] = useState(null);
  const scrollRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);

  const isRequest = !!room?.is_request && !locallyAccepted;

  // Base history (REST) + realtime/optimistic tail, de-duped, deletions applied.
  const msgs = useMemo(() => {
    const base = (page?.items || []).map(nm);
    const ids = new Set(base.map((m) => m.id));
    const all = [...base, ...live.filter((m) => !ids.has(m.id))];
    return deletedIds.size
      ? all.map((m) => (deletedIds.has(m.id) ? { ...m, is_deleted: true, content: null } : m))
      : all;
  }, [page, live, deletedIds]);

  // Other party's read cursor (max of REST snapshot and live "seen" events).
  const otherLastReadAt = room?.other_last_read_at || null;
  const otherReadAt = useMemo(() => {
    const a = otherLastReadAt ? new Date(otherLastReadAt).getTime() : 0;
    const b = liveSeenAt ? new Date(liveSeenAt).getTime() : 0;
    return b > a ? liveSeenAt : otherLastReadAt;
  }, [otherLastReadAt, liveSeenAt]);

  const addLive = (m) => setLive((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));

  const { sendTyping } = useChatRoomHub(roomId, {
    onMessage: (m) => {
      const msg = nm(m);
      if (String(msg.room_id) !== String(roomId)) return;
      addLive(msg);
      if (!isRequest && msg.sender_id !== me?.id) markRoomRead(roomId);
    },
    onTyping: (p) => {
      if ((p.user_id ?? p.userId) === me?.id) return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 2500);
    },
    onSeen: (p) => {
      if ((p.user_id ?? p.userId) === me?.id) return;
      setLiveSeenAt((p.last_read_at ?? p.lastReadAt) || new Date().toISOString());
    },
    onDeleted: (p) => {
      const id = p.message_id ?? p.messageId;
      setDeletedIds((prev) => new Set(prev).add(id));
    },
  });

  // Mark read on open + when messages change — but NOT for a pending request the
  // recipient hasn't accepted (they shouldn't reveal they've seen it yet).
  useEffect(() => {
    if (!roomId || isRequest || msgs.length === 0) return;
    markRoomRead(roomId);
  }, [roomId, isRequest, msgs.length]);

  // Keep pinned to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs.length, typing]);

  if (!isMobile) return <div className="page"><Seo title={t("chat.title")} robots="noindex, nofollow" /><ChatMobileGate /></div>;

  const doSend = () => {
    const text = input.trim();
    if (!text || send.isPending) return;
    setInput("");
    send.mutate(
      { message_type: "text", content: text, idempotency_key: crypto.randomUUID() },
      { onSuccess: (m) => addLive(nm(m)), onError: (e) => toast.error(errMsg(e)) }
    );
  };

  const shareStory = (story) => {
    setPickerOpen(false);
    send.mutate(
      { message_type: "story", shared_story_id: story.id, idempotency_key: crypto.randomUUID() },
      { onSuccess: (m) => addLive(nm(m)), onError: (e) => toast.error(errMsg(e)) }
    );
  };

  const onType = (e) => {
    setInput(e.target.value);
    const now = Date.now();
    if (now - lastTypingSent.current > 1500) { lastTypingSent.current = now; sendTyping(); }
  };

  const name = room?.other_username || "";

  return (
    <div className="chat-room">
      <Seo title={name ? `${name} — ${t("chat.title")}` : t("chat.title")} robots="noindex, nofollow" />

      <header className="chat-room-head">
        <button className="chat-back" onClick={() => nav("/chat")} aria-label={t("common.back")}><ArrowLeft size={20} /></button>
        <Img path={room?.other_avatar_url} seed={name} kind="avatar" alt={name} className="chat-head-av" />
        <div className="chat-head-name">
          <button className="clamp-1" onClick={() => room?.other_username && nav(`/u/${room.other_username}`)}>{name}</button>
          {typing && <span className="chat-head-typing">{t("chat.typing")}</span>}
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        {msgs.map((m) => {
          const mine = m.sender_id === me?.id;
          const seen = mine && otherReadAt && new Date(m.created_at) <= new Date(otherReadAt);
          return (
            <div key={m.id} className={`msg ${mine ? "mine" : "theirs"}`}>
              <div className="msg-bubble">
                {m.is_deleted ? (
                  <span className="msg-deleted">—</span>
                ) : m.message_type === "story" && m.shared_story_id ? (
                  <SharedStoryCard storyId={m.shared_story_id} />
                ) : m.message_type === "image" && m.image_url ? (
                  <Img path={m.image_url} seed={m.id} alt="" className="msg-image" />
                ) : (
                  <span className="msg-text">{m.content}</span>
                )}
                <span className="msg-meta">
                  {m.created_at && <span className="msg-time">{timeAgo(m.created_at)}</span>}
                  <Ticks mine={mine} seen={seen} />
                </span>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="msg theirs">
            <div className="msg-bubble typing"><i /><i /><i /></div>
          </div>
        )}
      </div>

      {isRequest ? (
        <div className="chat-request-bar">
          <div className="chat-request-txt">
            <b>{t("chat.requestTitle", { name })}</b>
            <span>{t("chat.requestSub")}</span>
          </div>
          <div className="row gap-8">
            <button
              className="btn btn-ghost btn-sm"
              disabled={decline.isPending}
              onClick={() => decline.mutate(roomId, {
                onSuccess: () => { toast.success(t("chat.declined")); nav("/chat"); },
                onError: (e) => toast.error(errMsg(e)),
              })}
            >{t("chat.decline")}</button>
            <button
              className="btn btn-primary btn-sm"
              disabled={accept.isPending}
              onClick={() => accept.mutate(roomId, {
                onSuccess: () => { setLocallyAccepted(true); toast.success(t("chat.accepted")); },
                onError: (e) => toast.error(errMsg(e)),
              })}
            >{t("chat.accept")}</button>
          </div>
        </div>
      ) : (
        <div className="chat-composer">
          <button className="chat-share-btn" onClick={() => setPickerOpen(true)} aria-label={t("chat.shareStory")}>
            <BookOpen size={20} />
          </button>
          <input
            className="chat-input"
            value={input}
            onChange={onType}
            onKeyDown={(e) => e.key === "Enter" && doSend()}
            placeholder={t("chat.messagePlaceholder")}
          />
          <button className="chat-send" onClick={doSend} disabled={!input.trim() || send.isPending} aria-label={t("chat.send") || "Send"}>
            <Send size={18} />
          </button>
        </div>
      )}

      <StorySharePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={shareStory} />
    </div>
  );
}
