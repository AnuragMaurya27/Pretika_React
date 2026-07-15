import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, LifeBuoy, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  useTicket, useTicketMessages, useAddTicketMessage, useCloseTicket, useRateTicket,
} from "../lib/hooks";
import { errMsg } from "../lib/api";
import { timeAgo } from "../lib/format";
import { PageLoader } from "../components/Art";
import { ErrorState } from "../components/EmptyState";
import StarRating from "../components/StarRating";
import Img from "../components/Img";
import Seo from "../components/Seo";

const STATUS_BADGE = {
  open: "badge-blue",
  in_progress: "badge-gold",
  waiting_user: "badge-gold",
  resolved: "badge-green",
  closed: "badge-red",
};

/** Single support-ticket thread: messages, reply, close & rate. */
export default function SupportTicket() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();

  const ticket = useTicket(id);
  const messages = useTicketMessages(id);
  const addMessage = useAddTicketMessage(id);
  const closeTicket = useCloseTicket(id);
  const rateTicket = useRateTicket(id);

  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const listRef = useRef(null);

  const tk = ticket.data;
  const msgs = messages.data || [];

  // keep the thread pinned to the newest message
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs.length]);

  if (ticket.isLoading) return <div className="app-shell"><PageLoader minHeight="70dvh" /></div>;
  if (ticket.isError || !tk) return <div className="app-shell"><ErrorState onRetry={ticket.refetch} /></div>;

  const isClosed = tk.status === "closed" || tk.status === "resolved";
  const canRate = isClosed && tk.satisfaction_rating == null;

  const send = (e) => {
    e?.preventDefault();
    const m = text.trim();
    if (!m || addMessage.isPending) return;
    addMessage.mutate(m, {
      onSuccess: () => setText(""),
      onError: (err) => toast.error(errMsg(err)),
    });
  };

  const doClose = () => {
    if (closeTicket.isPending) return;
    closeTicket.mutate(undefined, {
      onSuccess: () => toast.success(t("support.closed")),
      onError: (err) => toast.error(errMsg(err)),
    });
  };

  const doRate = (n) => {
    rateTicket.mutate(
      { rating: n, feedback: feedback.trim() || undefined },
      {
        onSuccess: () => toast.success(t("support.rated")),
        onError: (err) => toast.error(errMsg(err)),
      }
    );
  };

  return (
    <div className="app-shell" style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <Seo title={`${t("support.ticket")} #${tk.ticket_number}`} robots="noindex, follow" />

      <header className="container row gap-12" style={{ height: 56 }}>
        <button onClick={() => nav("/support")} aria-label={t("common.back")}><ArrowLeft size={22} /></button>
        <div style={{ minWidth: 0 }}>
          <div className="clamp-1 section-title" style={{ fontSize: 16 }}>{tk.subject}</div>
          <div className="muted row gap-8" style={{ fontSize: 11.5 }}>
            <span>#{tk.ticket_number}</span>
            <span className={`badge ${STATUS_BADGE[tk.status] || "badge-indigo"}`}>
              {t(`support.status.${tk.status}`, { defaultValue: tk.status?.replace(/_/g, " ") })}
            </span>
          </div>
        </div>
        {!isClosed && (
          <button
            className="btn btn-sm"
            style={{ marginLeft: "auto", background: "var(--indigo-50)", color: "var(--crimson)" }}
            onClick={doClose}
            disabled={closeTicket.isPending}
          >
            <XCircle size={15} /> {t("support.close")}
          </button>
        )}
      </header>

      <div className="container" style={{ maxWidth: 760, paddingBottom: 40 }}>
        {/* original description as the first "message" */}
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <div className="muted" style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            {t("support.description")}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{tk.description}</p>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>{timeAgo(tk.created_at)}</div>
        </div>

        {/* thread */}
        <div className="muted" style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "18px 0 10px" }}>
          {t("support.messages")}
        </div>
        <div ref={listRef} style={{ display: "grid", gap: 10, maxHeight: "48dvh", overflowY: "auto", paddingRight: 4 }}>
          {msgs.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, textAlign: "center", padding: "18px 0" }}>
              {t("support.noMessages")}
            </p>
          ) : (
            msgs.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex", gap: 10,
                  flexDirection: m.is_support ? "row" : "row-reverse",
                }}
              >
                {m.is_support ? (
                  <span style={supAvatar}><LifeBuoy size={16} /></span>
                ) : (
                  <Img path={m.sender_avatar_url} seed={m.sender_username} kind="avatar" alt=""
                    style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                )}
                <div
                  style={{
                    maxWidth: "78%", padding: "10px 13px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.55,
                    background: m.is_support ? "var(--bg-card)" : "var(--indigo-600)",
                    color: m.is_support ? "var(--text-primary)" : "#fff",
                    border: m.is_support ? "1px solid var(--border)" : "none",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.75, marginBottom: 3 }}>
                    {m.is_support ? t("support.supportTeam") : t("support.you")} · {timeAgo(m.created_at)}
                  </div>
                  {m.message}
                </div>
              </div>
            ))
          )}
        </div>

        {/* reply box */}
        {!isClosed && (
          <form className="row gap-8" style={{ marginTop: 14 }} onSubmit={send}>
            <input
              className="input"
              style={{ flex: 1 }}
              value={text}
              maxLength={5000}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("support.replyPh")}
            />
            <button
              className="btn btn-primary"
              style={{ width: 52, padding: 0, flexShrink: 0 }}
              disabled={!text.trim() || addMessage.isPending}
              aria-label={t("support.send")}
            >
              <Send size={18} />
            </button>
          </form>
        )}

        {/* rate closed/resolved support */}
        {canRate && (
          <div className="card" style={{ padding: 16, marginTop: 18, textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 10 }}>{t("support.rate")}</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <StarRating value={0} onRate={doRate} disabled={rateTicket.isPending} />
            </div>
            <input
              className="input"
              style={{ marginTop: 12 }}
              value={feedback}
              maxLength={500}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t("support.feedbackPh")}
            />
          </div>
        )}
        {isClosed && tk.satisfaction_rating != null && (
          <div className="row gap-8" style={{ marginTop: 16, justifyContent: "center" }}>
            <StarRating value={tk.satisfaction_rating} readOnly size={22} />
          </div>
        )}
      </div>
    </div>
  );
}

const supAvatar = {
  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
  display: "grid", placeItems: "center",
  background: "var(--indigo-50)", color: "var(--crimson)", border: "1px solid var(--indigo-100)",
};
