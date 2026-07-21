import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as signalR from "@microsoft/signalr";
import { get, post, getToken } from "./api";
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
export function usePrivateChats() {
  return useQuery({
    queryKey: ["chat", "private"],
    queryFn: () => get("/chat/rooms/private"),
    staleTime: 1000 * 15,
  });
}

export function useChatMessages(roomId) {
  return useQuery({
    queryKey: ["chat", "messages", roomId],
    queryFn: () => get(`/chat/rooms/${roomId}/messages?page=1&page_size=50`),
    enabled: !!roomId,
  });
}

export function useStartChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) => post("/chat/rooms/private", { target_user_id: targetUserId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "private"] }),
  });
}

export function useSendMessage(roomId) {
  return useMutation({
    mutationFn: (body) => post(`/chat/rooms/${roomId}/messages`, body),
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
