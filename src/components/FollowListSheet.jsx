import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, BadgeCheck, ChevronRight, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFollowers, useFollowing } from "../lib/hooks";
import { compact } from "../lib/format";
import Img from "./Img";
import EmptyState from "./EmptyState";
import { ListItemSkeleton } from "./Skeleton";

// Track the desktop breakpoint so the panel can be a centred modal on wide
// screens and a bottom sheet on phones.
function useIsDesktop() {
  const [d, setD] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => setD(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return d;
}

/**
 * Followers / following list.
 *  - phones: bottom sheet that slides up (with a grip)
 *  - laptop / tablet: centred modal dialog
 * Rendered in a portal on document.body so the page's transition `filter`
 * can't trap its `position: fixed` (which pushed it off-screen before).
 *
 * Props: open, onClose, userId, type ("followers" | "following"), title
 */
export default function FollowListSheet({ open, onClose, userId, type = "followers", title }) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const isDesktop = useIsDesktop();

  const followers = useFollowers(userId, open && type === "followers");
  const following = useFollowing(userId, open && type === "following");
  const state = type === "followers" ? followers : following;

  const items = state.data?.items;
  const filtered = useMemo(() => {
    const list = items || [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((u) =>
      (u.username || "").toLowerCase().includes(needle) ||
      (u.display_name || "").toLowerCase().includes(needle),
    );
  }, [items, q]);

  const heading = title || (type === "followers" ? t("common.followers") : t("common.following"));

  // lock background scroll + close on Escape while open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const panelMotion = isDesktop
    ? {
        initial: { opacity: 0, scale: 0.94, y: 14 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 10 },
        transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
      }
    : {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
        transition: { type: "spring", damping: 32, stiffness: 320 },
      };

  return createPortal(
    <AnimatePresence onExitComplete={() => setQ("")}>
      {open && (
        <>
          <motion.div
            className="fls-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fls-wrap" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
            <motion.div className="fls-sheet" role="dialog" aria-modal="true" aria-label={heading} {...panelMotion}>
              <div className="fls-grip" aria-hidden />

              <div className="between fls-head">
                <span style={{ fontWeight: 800, fontSize: 18, textTransform: "capitalize" }}>{heading}</span>
                <button onClick={onClose} className="fls-close" aria-label={t("common.close")}><X size={19} /></button>
              </div>

              <div className="input-wrap fls-search">
                <span className="fls-search-ic"><Search size={18} /></span>
                <input
                  className="input" style={{ paddingLeft: 42 }}
                  placeholder={t("common.search")}
                  value={q} onChange={(e) => setQ(e.target.value)}
                  autoFocus={isDesktop}
                />
                {q && <button className="input-icon-btn" onClick={() => setQ("")}><X size={18} /></button>}
              </div>

              <div className="fls-list">
                {state.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <ListItemSkeleton key={i} />)
                ) : filtered.length === 0 ? (
                  <EmptyState
                    icon={<Users size={32} />}
                    sub={q ? t("explore.noResults", { q }) : t("common.nothingHere")}
                  />
                ) : (
                  filtered.map((u) => (
                    <Link key={u.id} to={`/u/${u.username}`} onClick={onClose} className="follow-row fls-row">
                      <Img path={u.avatar_url} seed={u.username} kind="avatar" alt=""
                        style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row gap-4">
                          <span className="clamp-1" style={{ fontWeight: 700, fontSize: 14.5 }}>{u.display_name || u.username}</span>
                          {u.is_verified_creator && <BadgeCheck size={14} color="var(--blue)" style={{ flexShrink: 0 }} />}
                        </div>
                        <div className="tertiary clamp-1" style={{ fontSize: 12 }}>
                          @{u.username}
                          {u.total_followers > 0 && <> · {compact(u.total_followers)} {t("common.followers")}</>}
                        </div>
                      </div>
                      <ChevronRight size={17} className="tertiary" style={{ flexShrink: 0 }} />
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
