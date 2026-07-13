import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, BellOff, Check, X, UserPlus, MessageCircle, Megaphone, Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useNotifications, useUnreadCount, useMarkNotifRead, useMarkAllNotifRead, useDeleteNotif,
} from "../lib/hooks";
import { get } from "../lib/api";
import { timeAgo } from "../lib/format";
import Img from "./Img";

/**
 * Notification bell + dropdown — fully driven by the .NET API's
 * /api/notifications endpoints (list, unread-count, read, read-all, delete).
 *
 * Only the notification types that map to features live on THIS web app are
 * click-routable:
 *   - follow      → /u/{actor_username}      (creator profile)
 *   - new_comment → /story/{slug} (slug resolved from the story id in
 *                   action_url via GET /stories/id/{id}, since the web routes
 *                   by slug while the API's action_url carries the guid)
 * Everything else (system/announcements, or types from features not on the web
 * like arena/wallet) still shows in the list and marks-read, but doesn't
 * navigate — so nothing ever leads to a dead route.
 *
 * The panel portals to <body> and is position:fixed under the bell so it
 * escapes any ancestor transform (page-transition wrapper / sticky headers).
 */

const TYPE_ICON = { follow: UserPlus, new_comment: MessageCircle, system: Megaphone };

export default function NotificationBell({ dark = false }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const { data: countData } = useUnreadCount();
  const unread = countData?.unread_count || 0;

  const { data, isLoading, isError, refetch, isFetching } = useNotifications(open);
  const items = data?.items || [];

  const markRead = useMarkNotifRead();
  const markAll = useMarkAllNotifRead();
  const removeNotif = useDeleteNotif();

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(400, window.innerWidth - 16);
    setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right), width });
  }, []);

  // position once when opening, and keep it aligned on resize
  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, place]);

  // close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // notification → in-app route (null = no navigation, just mark read)
  const resolveHref = useCallback(async (n) => {
    const type = n.notification_type;
    if (type === "follow" && n.actor_username) return `/u/${n.actor_username}`;
    if (type === "new_comment") {
      const m = /\/story\/([0-9a-fA-F-]{36})/.exec(n.action_url || "");
      if (m) {
        try {
          const s = await get(`/stories/id/${m[1]}`);
          if (s?.slug) return `/story/${s.slug}`;
        } catch { /* fall through — just mark read */ }
      }
    }
    return null;
  }, []);

  const onItemClick = async (n) => {
    if (!n.is_read) markRead.mutate(n.id);
    const href = await resolveHref(n);
    setOpen(false);
    if (href) nav(href);
  };

  const onDelete = (e, id) => {
    e.stopPropagation();
    removeNotif.mutate(id);
  };

  const iconColor = dark ? "#fff" : "var(--text-primary)";

  return (
    <>
      <button
        ref={btnRef}
        className={`ntf-bell ${dark ? "dark" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={t("notif.title")}
        aria-expanded={open}
      >
        <Bell size={20} color={iconColor} />
        {unread > 0 && (
          <span className="ntf-badge" aria-label={t("notif.unreadN", { n: unread })}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={panelRef}
              className="ntf-panel"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              style={{ top: pos.top, right: pos.right, width: pos.width }}
              role="dialog"
              aria-label={t("notif.title")}
            >
              <div className="ntf-head">
                <span className="ntf-title">
                  <Bell size={15} /> {t("notif.title")}
                  {unread > 0 && <i className="ntf-head-count">{unread}</i>}
                </span>
                <div className="ntf-head-actions">
                  {unread > 0 && (
                    <button
                      className="ntf-mark-all"
                      onClick={() => markAll.mutate()}
                      disabled={markAll.isPending}
                    >
                      <Check size={13} /> {t("notif.markAll")}
                    </button>
                  )}
                  <button className="ntf-close" onClick={() => setOpen(false)} aria-label={t("common.close")}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="ntf-list">
                {isLoading ? (
                  [0, 1, 2].map((i) => (
                    <div key={i} className="ntf-item skeleton">
                      <span className="ntf-av shimmer" />
                      <div style={{ flex: 1 }}>
                        <span className="ntf-sk-line shimmer" style={{ width: "70%" }} />
                        <span className="ntf-sk-line shimmer" style={{ width: "45%" }} />
                      </div>
                    </div>
                  ))
                ) : isError ? (
                  <div className="ntf-empty">
                    <BellOff size={26} />
                    <p>{t("common.somethingWrong")}</p>
                    <button className="ntf-retry" onClick={() => refetch()}>{t("common.retry")}</button>
                  </div>
                ) : items.length === 0 ? (
                  <div className="ntf-empty">
                    <BellOff size={26} />
                    <p>{t("notif.empty")}</p>
                    <span className="ntf-empty-sub">{t("notif.emptySub")}</span>
                  </div>
                ) : (
                  items.map((n) => {
                    const Icon = TYPE_ICON[n.notification_type] || Bell;
                    return (
                      <button
                        key={n.id}
                        className={`ntf-item ${n.is_read ? "" : "unread"}`}
                        onClick={() => onItemClick(n)}
                      >
                        <span className="ntf-av-wrap">
                          {n.actor_username || n.actor_avatar_url ? (
                            <Img
                              path={n.actor_avatar_url}
                              seed={n.actor_username}
                              kind="avatar"
                              alt=""
                              className="ntf-av"
                            />
                          ) : (
                            <span className="ntf-av ntf-av-icon"><Icon size={17} /></span>
                          )}
                          <span className="ntf-type"><Icon size={10} /></span>
                        </span>
                        <span className="ntf-body">
                          <span className="ntf-item-title clamp-1">{n.title}</span>
                          <span className="ntf-msg clamp-2">{n.message}</span>
                          <span className="ntf-time">{timeAgo(n.created_at)}</span>
                        </span>
                        {!n.is_read && <i className="ntf-dot" aria-hidden="true" />}
                        <span
                          className="ntf-del"
                          role="button"
                          tabIndex={-1}
                          aria-label={t("notif.delete")}
                          onClick={(e) => onDelete(e, n.id)}
                        >
                          <X size={14} />
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {isFetching && !isLoading && (
                <div className="ntf-foot"><Loader2 size={13} className="ntf-spin" /> {t("notif.updating")}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
