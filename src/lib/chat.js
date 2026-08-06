import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as signalR from "@microsoft/signalr";
import { get, post, put, getToken } from "./api";
import { BASE_URL } from "./constants";

/* ═══════════════════════════════════════════════════════════════════════════
   Chat data layer — private 1-1 rooms, message-requests (General vs Requests),
   single/double ticks, typing, in-chat story sharing. Talks to Modules/Chat.
   Realtime over SignalR hub `/hubs/chat` (JWT via ?access_token=).
   ═══════════════════════════════════════════════════════════════════════════ */

// Same-origin proxy in dev (Vite proxies /hubs with ws:true); direct in prod.
const HUB_URL = import.meta.env.DEV ? "/hubs/chat" : `${BASE_URL}/hubs/chat`;

/* ---- REST hooks -------------------------------------------------------- */

// All my private rooms — each carries accepted / is_request / unread_count /
// other_last_read_at so the UI can split General vs Requests and draw ticks.
// Polls in the foreground (and refetches on app-foreground) so the unread badge
// on the Chats tab stays live app-wide without a manual refresh.
export function usePrivateChats(enabled = true) {
  return useQuery({
    queryKey: ["chat", "private"],
    queryFn: () => get("/chat/rooms/private"),
    enabled,
    staleTime: 1000 * 15,
    refetchInterval: 20000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

// Total unread across accepted (non-request) rooms — drives the tab-bar badge.
// Requests are surfaced separately by the "Requests" tab, so they don't count here.
export function useChatUnreadTotal(enabled = true) {
  const { data } = usePrivateChats(enabled);
  const rooms = Array.isArray(data) ? data : [];
  return rooms.reduce((n, r) => n + (r.is_request ? 0 : r.unread_count || 0), 0);
}

export function useChatMessages(roomId) {
  return useQuery({
    queryKey: ["chat", "messages", roomId],
    queryFn: () => get(`/chat/rooms/${roomId}/messages?page=1&page_size=50`),
    enabled: !!roomId,
    // Realtime writes land in this cache directly, but keep a light poll +
    // refetch-on-foreground as a safety net so a missed SignalR event still
    // heals on its own (no more "refresh karke dikhta hai").
    staleTime: 0,
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useStartChat() {
  const qc = useQueryClient();
  return useMutation({
    // targetUserId, or { targetUserId, payCoins } to authorise a paid-inbox charge.
    mutationFn: (arg) => {
      const { targetUserId, payCoins } =
        typeof arg === "object" && arg !== null ? arg : { targetUserId: arg };
      return post("/chat/rooms/private", {
        target_user_id: targetUserId,
        ...(payCoins ? { pay_coins: payCoins } : {}),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", "private"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

/* ---- Paid Inbox -------------------------------------------------------- */

// My paid-inbox settings + eligibility (needs >= min followers).
export function useDmSettings(enabled = true) {
  return useQuery({
    queryKey: ["chat", "dm-settings"],
    queryFn: () => get("/chat/dm-settings"),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useUpdateDmSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => put("/chat/dm-settings", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "dm-settings"] }),
  });
}

// Does messaging this user cost coins? (drives the pay-to-message prompt)
export function useDmInfo(targetUserId, enabled = true) {
  return useQuery({
    queryKey: ["chat", "dm-info", targetUserId],
    queryFn: () => get(`/chat/dm-info/${targetUserId}`),
    enabled: !!targetUserId && enabled,
    staleTime: 1000 * 20,
  });
}

export function useSendMessage(roomId) {
  return useMutation({
    mutationFn: (body) => post(`/chat/rooms/${roomId}/messages`, body),
  });
}

// Upload one image (JPG/PNG/WebP/GIF ≤5MB) to the chat store; resolves to the
// stored relative path ("/chat-images/…") which then rides on an image message.
export function useUploadChatImage() {
  return useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await post("/chat/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res?.url;
    },
  });
}

export function useAcceptRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId) => post(`/chat/rooms/${roomId}/accept`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "private"] }),
  });
}

export function useDeclineRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId) => post(`/chat/rooms/${roomId}/decline`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "private"] }),
  });
}

// Persist the read cursor (single→double tick for the other party) — fire & forget.
export function markRoomRead(roomId) {
  return post(`/chat/rooms/${roomId}/read`).catch(() => {});
}

/* ---- SignalR realtime --------------------------------------------------- */

/**
 * Live connection scoped to one room. Wires the hub events to the given
 * callbacks and returns { sendTyping } for the composer.
 *   NewMessage(msg) · UserTyping({user_id,username}) ·
 *   MessageSeen({user_id,last_read_at}) · MessageDeleted({message_id})
 */
export function useChatRoomHub(roomId, { onMessage, onTyping, onSeen, onDeleted } = {}) {
  const connRef = useRef(null);
  const cbs = useRef({});
  // Keep the latest callbacks without re-subscribing the hub (updated post-render).
  useEffect(() => { cbs.current = { onMessage, onTyping, onSeen, onDeleted }; });

  useEffect(() => {
    if (!roomId || !getToken()) return;
    let cancelled = false;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => getToken() || "" })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    conn.on("NewMessage", (m) => cbs.current.onMessage?.(m));
    conn.on("UserTyping", (p) => cbs.current.onTyping?.(p));
    conn.on("MessageSeen", (p) => cbs.current.onSeen?.(p));
    conn.on("MessageDeleted", (p) => cbs.current.onDeleted?.(p));

    const joinRoom = () => conn.invoke("JoinRoom", String(roomId)).catch(() => {});

    conn.start()
      .then(() => { if (!cancelled) { connRef.current = conn; joinRoom(); } })
      .catch(() => {});
    // Re-join after an automatic reconnect.
    conn.onreconnected(joinRoom);

    return () => {
      cancelled = true;
      connRef.current = null;
      conn.invoke("LeaveRoom", String(roomId)).catch(() => {});
      conn.stop().catch(() => {});
    };
  }, [roomId]);

  const sendTyping = () => {
    connRef.current?.invoke("Typing", { RoomId: String(roomId) }).catch(() => {});
  };

  return { sendTyping };
}

/* ---- viewport (chat is mobile-only per spec) ---------------------------- */

// iPad/laptop/TV (≥768) get a "open on mobile" screen; phones get the real chat.
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : true
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}
