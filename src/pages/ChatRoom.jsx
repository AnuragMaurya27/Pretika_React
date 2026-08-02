import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ArrowLeft, Send, BookOpen, Check, CheckCheck, X, Clock, RotateCw, ImagePlus, Smile, Sparkles, Coins, Plus } from "lucide-react";
import { get, errMsg } from "../lib/api";
import {
  useChatMessages, useSendMessage, useUploadChatImage, useChatRoomHub, usePrivateChats,
  useAcceptRequest, useDeclineRequest, markRoomRead, useIsMobile,
} from "../lib/chat";
import { useBookmarked } from "../lib/hooks";
import { useAuth } from "../store/auth";
import Img from "../components/Img";
import ImageLightbox from "../components/ImageLightbox";
import EmojiPicker from "../components/EmojiPicker";
import SuperChatSheet from "../components/SuperChatSheet";
import { tierColor } from "../lib/superchat";
import Seo from "../components/Seo";
import ChatMobileGate from "../components/ChatMobileGate";
import { mediaUrl } from "../lib/constants";
import { timeAgo } from "../lib/format";

// Max chat image size mirrors the backend (5MB).
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// SignalR serialises camelCase; REST is snake_case — fold both into one shape.
function nm(m) {
  return {
    id: m.id,
    room_id: m.room_id ?? m.roomId,
    sender_id: m.sender_id ?? m.senderId,
    message_type: m.message_type ?? m.messageType,
    content: m.content ?? null,
    image_url: m.image_url ?? m.imageUrl ?? null,
    sticker_id: m.sticker_id ?? m.stickerId ?? null,
    shared_story_id: m.shared_story_id ?? m.sharedStoryId ?? null,
    is_super_chat: m.is_super_chat ?? m.isSuperChat ?? false,
    super_chat_coins: m.super_chat_coins ?? m.superChatCoins ?? 0,
    super_chat_highlight_color: m.super_chat_highlight_color ?? m.superChatHighlightColor ?? null,
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

// Attachment menu: photo · story · super chat.
function AttachSheet({ open, onClose, onPhoto, onStory, onSuper }) {
  const { t } = useTranslation();
  if (!open) return null;
  const rows = [
    { key: "photo", Icon: ImagePlus, label: t("chat.sendPhoto"), onClick: onPhoto, tint: "var(--indigo-600)" },
    { key: "story", Icon: BookOpen, label: t("chat.shareStory"), onClick: onStory, tint: "var(--indigo-600)" },
    { key: "super", Icon: Sparkles, label: t("chat.superChat"), onClick: onSuper, tint: "var(--gold)" },
  ];
  return createPortal(
    <div className="chat-sheet-backdrop" onClick={onClose}>
      <div className="chat-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="chat-sheet-head">
          <span>{t("chat.attach")}</span>
          <button className="chat-sheet-x" onClick={onClose} aria-label={t("common.close")}><X size={18} /></button>
        </div>
        <div className="attach-list">
          {rows.map(({ key, Icon, label, onClick, tint }) => (
            <button key={key} className="attach-row" onClick={onClick}>
              <span className="attach-ic" style={{ color: tint }}><Icon size={20} /></span>
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>{label}</span>
            </button>
          ))}
        </div>
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

  const qc = useQueryClient();
  const send = useSendMessage(roomId);
  const upload = useUploadChatImage();
  const accept = useAcceptRequest();
  const decline = useDeclineRequest();

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [locallyAccepted, setLocallyAccepted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [superOpen, setSuperOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [live, setLive] = useState([]);              // realtime + optimistic messages
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [liveSeenAt, setLiveSeenAt] = useState(null);
  const [lightbox, setLightbox] = useState(null);    // { src, filename } for full-screen view
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
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
      setLive((prev) => {
        // My own message echoed back → drop the matching optimistic bubble (no dupe).
        const rest = msg.sender_id === me?.id
          ? prev.filter((x) => !(x._optimistic && x.message_type === msg.message_type && (x.content || "") === (msg.content || "")))
          : prev;
        return rest.some((x) => x.id === msg.id) ? rest : [...rest, msg];
      });
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

  // Lock the page behind the full-screen chat so it never drifts (native-app feel).
  useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isMobile]);

  if (!isMobile) return <div className="page"><Seo title={t("chat.title")} robots="noindex, nofollow" /><ChatMobileGate /></div>;

  // Optimistic send: the bubble appears instantly (native-chat feel). On a cold
  // backend the POST may be slow/fail even though the message reached the server
  // (the live echo reconciles it) — so instead of a scary "network error" toast we
  // show a tap-to-retry marker only if it truly failed.
  const sendMsg = (body, optimistic) => {
    addLive(optimistic);
    send.mutate(body, {
      onSuccess: (m) => {
        const real = nm(m);
        setLive((prev) => {
          const rest = prev.filter((x) => x._key !== optimistic._key);
          return rest.some((x) => x.id === real.id) ? rest : [...rest, real];
        });
        // Super Chat debited the coin wallet — pull the fresh balance.
        if (body.message_type === "super_chat") qc.invalidateQueries({ queryKey: ["wallet"] });
      },
      onError: (e) => {
        setLive((prev) => prev.map((x) => (x._key === optimistic._key ? { ...x, _pending: false, _failed: true } : x)));
        if (body.message_type === "super_chat") toast.error(errMsg(e) || t("chat.superChatFailed"));
      },
    });
  };
  const sendText = (text) => {
    const key = crypto.randomUUID();
    sendMsg(
      { message_type: "text", content: text, idempotency_key: key },
      { id: "tmp-" + key, _key: key, _optimistic: true, _pending: true, room_id: roomId, sender_id: me?.id, message_type: "text", content: text, created_at: new Date().toISOString() }
    );
  };
  const doSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendText(text);
  };
  const shareStory = (story) => {
    setPickerOpen(false);
    const key = crypto.randomUUID();
    sendMsg(
      { message_type: "story", shared_story_id: story.id, idempotency_key: key },
      { id: "tmp-" + key, _key: key, _optimistic: true, _pending: true, room_id: roomId, sender_id: me?.id, message_type: "story", shared_story_id: story.id, created_at: new Date().toISOString() }
    );
  };
  // Super Chat: highlighted, coin-paid message. Carries whatever's typed as its
  // content; the backend deducts coins and credits the recipient's earnings.
  const sendSuperChat = (coins, color) => {
    setSuperOpen(false);
    const text = input.trim();
    setInput("");
    const key = crypto.randomUUID();
    sendMsg(
      { message_type: "super_chat", content: text || null, super_chat_coins: coins, super_chat_highlight_color: color, idempotency_key: key },
      { id: "tmp-" + key, _key: key, _optimistic: true, _pending: true, room_id: roomId, sender_id: me?.id, message_type: "super_chat", content: text, is_super_chat: true, super_chat_coins: coins, super_chat_highlight_color: color, created_at: new Date().toISOString() }
    );
  };
  const insertEmoji = (e) => setInput((v) => v + e);
  // Two-step: upload the file, then send an image message carrying its URL. The
  // bubble appears instantly with a local blob preview (native-chat feel); once
  // the send echoes back we swap in the stored URL. The File is kept on the
  // optimistic bubble so a failed send can be retried without re-picking.
  const sendImage = (file) => {
    const key = crypto.randomUUID();
    const localUrl = URL.createObjectURL(file);
    addLive({
      id: "tmp-" + key, _key: key, _optimistic: true, _pending: true, _localSrc: localUrl, _file: file,
      room_id: roomId, sender_id: me?.id, message_type: "image", image_url: localUrl, created_at: new Date().toISOString(),
    });
    upload.mutate(file, {
      onSuccess: (url) => {
        send.mutate({ message_type: "image", image_url: url, idempotency_key: key }, {
          onSuccess: (m) => {
            const real = nm(m);
            setLive((prev) => {
              const rest = prev.filter((x) => x._key !== key);
              return rest.some((x) => x.id === real.id) ? rest : [...rest, real];
            });
            URL.revokeObjectURL(localUrl);
          },
          onError: () => setLive((prev) => prev.map((x) => (x._key === key ? { ...x, _pending: false, _failed: true } : x))),
        });
      },
      onError: (e) => {
        toast.error(errMsg(e) || t("chat.photoError"));
        setLive((prev) => prev.map((x) => (x._key === key ? { ...x, _pending: false, _failed: true } : x)));
      },
    });
  };
  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";          // allow re-picking the same file
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) return toast.error(t("chat.photoTooLarge"));
    sendImage(file);
  };
  const retry = (m) => {
    setLive((prev) => prev.filter((x) => x._key !== m._key));
    if (m.message_type === "story") shareStory({ id: m.shared_story_id });
    else if (m.message_type === "image" && m._file) sendImage(m._file);
    else if (m.message_type === "super_chat") {
      const key = crypto.randomUUID();
      sendMsg(
        { message_type: "super_chat", content: m.content || null, super_chat_coins: m.super_chat_coins, super_chat_highlight_color: m.super_chat_highlight_color, idempotency_key: key },
        { ...m, id: "tmp-" + key, _key: key, _optimistic: true, _pending: true, _failed: false, created_at: new Date().toISOString() }
      );
    }
    else sendText(m.content);
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
          const isSuper = m.is_super_chat && !m.is_deleted;
          const scColor = isSuper ? (m.super_chat_highlight_color || tierColor(m.super_chat_coins)) : null;
          return (
            <div key={m.id} className={`msg ${mine ? "mine" : "theirs"} ${isSuper ? "msg-super" : ""}`}>
              <div className={`msg-bubble ${isSuper ? "super" : ""}`} style={isSuper ? { "--sc": scColor } : undefined}>
                {isSuper && (
                  <span className="msg-sc-badge"><Coins size={12} /> {m.super_chat_coins} · {t("chat.superChat")}</span>
                )}
                {m.is_deleted ? (
                  <span className="msg-deleted">—</span>
                ) : m.message_type === "story" && m.shared_story_id ? (
                  <SharedStoryCard storyId={m.shared_story_id} />
                ) : m.message_type === "image" && m.image_url ? (
                  <button
                    type="button"
                    className="msg-image-btn"
                    onClick={() => setLightbox({
                      src: m._localSrc || mediaUrl(m.image_url),
                      filename: (m.image_url || "").split("/").pop(),
                    })}
                  >
                    {m._localSrc
                      ? <img src={m._localSrc} alt="" className="msg-image" />
                      : <Img path={m.image_url} seed={m.id} alt="" className="msg-image" />}
                  </button>
                ) : (
                  <span className="msg-text">{m.content}</span>
                )}
                <span className="msg-meta">
                  {m._pending ? (
                    <Clock size={12} className="tick" />
                  ) : m._failed ? (
                    <button className="msg-retry" onClick={() => retry(m)} aria-label="retry"><RotateCw size={12} /></button>
                  ) : (
                    <>
                      {m.created_at && <span className="msg-time">{timeAgo(m.created_at)}</span>}
                      <Ticks mine={mine} seen={seen} />
                    </>
                  )}
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
        <>
          {emojiOpen && <EmojiPicker onPick={insertEmoji} onClose={() => setEmojiOpen(false)} />}
          <div className="chat-composer">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={onPickImage}
            />
            <button className={`chat-share-btn chat-emoji-btn ${emojiOpen ? "on" : ""}`} onClick={() => setEmojiOpen((v) => !v)} aria-label={t("chat.emoji")}>
              <Smile size={20} />
            </button>
            <button className="chat-share-btn" onClick={() => setAttachOpen(true)} aria-label={t("chat.attach")}>
              <Plus size={20} />
            </button>
            <input
              className="chat-input"
              value={input}
              onChange={onType}
              onKeyDown={(e) => e.key === "Enter" && doSend()}
              onFocus={() => setEmojiOpen(false)}
              placeholder={t("chat.messagePlaceholder")}
            />
            <button className="chat-send" onClick={doSend} disabled={!input.trim()} aria-label={t("chat.send")}>
              <Send size={18} />
            </button>
          </div>
        </>
      )}

      <AttachSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        onPhoto={() => { setAttachOpen(false); fileRef.current?.click(); }}
        onStory={() => { setAttachOpen(false); setPickerOpen(true); }}
        onSuper={() => { setAttachOpen(false); setSuperOpen(true); }}
      />
      <StorySharePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={shareStory} />
      <SuperChatSheet open={superOpen} onClose={() => setSuperOpen(false)} onSend={sendSuperChat} sending={send.isPending} />

      {lightbox && (
        <ImageLightbox src={lightbox.src} filename={lightbox.filename} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
