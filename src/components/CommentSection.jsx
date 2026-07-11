import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, MoreVertical, Trash2, Flag, Send, Star,
  Pin, PinOff, ChevronDown, CornerDownRight, ArrowUpDown, Sparkles, Layers,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  useCommentsInfinite, useAddComment, useLikeComment,
  useDeleteComment, useReportComment, usePinComment, useReplies,
} from "../lib/hooks";
import Img from "./Img";
import { useAuth } from "../store/auth";
import { errMsg, writeLikelySucceeded } from "../lib/api";
import { compact, timeAgo } from "../lib/format";

/**
 * CommentSection — the shared discussion module.
 *
 * Story page:   <CommentSection storyId={id} creatorId={…} episodes={[…]} />
 * Reader page:  <CommentSection storyId={id} episodeId={epId} creatorId={…} />
 *
 * The API has no per-episode comment listing, so the episode view filters the
 * loaded pages client-side (every comment carries its episode_id). Inside the
 * reader shell all colors re-skin via the --cmt-* vars (see index.css).
 */
export default function CommentSection({ storyId, episodeId = null, creatorId, episodes = [] }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const me = useAuth((s) => s.user);
  const authed = useAuth((s) => s.isAuthed)();

  const query = useCommentsInfinite(storyId);
  const add = useAddComment(storyId);
  const [sort, setSort] = useState("new");
  const [text, setText] = useState("");
  const taRef = useRef(null);

  const requireAuth = () => {
    if (!authed) { toast.error(t("toast.loginRequired")); nav("/login"); return false; }
    return true;
  };

  const all = useMemo(
    () => (query.data?.pages || []).flatMap((p) => p?.items || []),
    [query.data]
  );
  const visible = useMemo(() => {
    const list = episodeId ? all.filter((c) => c.episode_id === episodeId) : all;
    const by = sort === "top"
      ? (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
      : (a, b) => new Date(b.created_at) - new Date(a.created_at);
    return [...list].sort((a, b) => (b.is_pinned === true) - (a.is_pinned === true) || by(a, b));
  }, [all, episodeId, sort]);

  const totalThreads = episodeId
    ? visible.length
    : (query.data?.pages?.[0]?.total_count ?? visible.length);
  const epNumberFor = (id) => episodes.find((e) => e.id === id)?.episode_number;

  const grow = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 170) + "px";
  };

  const postComment = () => {
    if (!requireAuth()) return;
    const v = text.trim();
    if (!v) return;
    const done = () => {
      setText("");
      if (taRef.current) taRef.current.style.height = "auto";
      setSort("new");
      toast.success(t("toast.commentAdded"));
    };
    add.mutate({ content: v, ...(episodeId ? { episodeId } : {}) }, {
      onSuccess: done,
      // The comment still saves when the server's post-insert XP step 500s (or
      // that 500 gets CORS-blocked into a "Network Error") — useAddComment's
      // onSettled refetch surfaces it, so treat those as success, not an error.
      onError: (e) => (writeLikelySucceeded(e) ? done() : toast.error(errMsg(e))),
    });
  };

  return (
    <section className="cmt-wrap">
      {/* header — title + client-side sort */}
      <div className="between" style={{ gap: 10, flexWrap: "wrap" }}>
        <div className="row gap-8">
          <MessageCircle size={17} style={{ color: "var(--cmt-accent)" }} />
          <span style={{ fontWeight: 800, fontSize: 15.5 }}>
            {episodeId ? t("story.commentsOnEpisode") : t("story.comments")}
          </span>
          {totalThreads > 0 && <span className="cmt-count">{compact(totalThreads)}</span>}
        </div>
        {visible.length > 1 && (
          <div className="cmt-seg" role="tablist" aria-label="Sort comments">
            <button className={sort === "top" ? "on" : ""} onClick={() => setSort("top")}>
              <Sparkles size={12} /> {t("story.topComments")}
            </button>
            <button className={sort === "new" ? "on" : ""} onClick={() => setSort("new")}>
              <ArrowUpDown size={12} /> {t("story.newestComments")}
            </button>
          </div>
        )}
      </div>

      {/* composer */}
      {authed ? (
        <div className="cmt-composer">
          <Img path={me?.avatar_url} seed={me?.username} kind="avatar" alt=""
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          <div className="cmt-inputwrap">
            <textarea
              ref={taRef}
              rows={1}
              maxLength={1000}
              placeholder={t("story.writeComment")}
              value={text}
              onChange={(e) => { setText(e.target.value); grow(e.target); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); postComment(); }
              }}
            />
            <div className="between" style={{ padding: "0 6px 6px" }}>
              <span className="cmt-hint">{text.length > 800 ? `${text.length}/1000` : ""}</span>
              <button
                className="cmt-post"
                onClick={postComment}
                disabled={add.isPending || !text.trim()}
                aria-label={t("story.writeComment")}
              >
                <Send size={15} /> {t("story.post")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button className="cmt-login" onClick={requireAuth}>
          <MessageCircle size={16} />
          {t("story.loginToComment")}
        </button>
      )}

      {/* list */}
      {query.isLoading ? (
        <div style={{ display: "grid", gap: 14, paddingTop: 6 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="row gap-10" style={{ alignItems: "flex-start" }}>
              <div className="shimmer" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "grid", gap: 6 }}>
                <div className="shimmer" style={{ height: 12, width: "35%", borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 12, width: "80%", borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="cmt-empty">
          <MessageCircle size={30} strokeWidth={1.6} />
          <div style={{ fontWeight: 700, fontSize: 14 }}>{t("story.noComments")}</div>
          <div style={{ fontSize: 12.5, color: "var(--cmt-faint)" }}>{t("story.noCommentsSub")}</div>
        </div>
      ) : (
        <div>
          {visible.map((c) => (
            <CommentCard
              key={c.id}
              c={c}
              storyId={storyId}
              creatorId={creatorId}
              me={me}
              requireAuth={requireAuth}
              epNumber={!episodeId && c.episode_id ? epNumberFor(c.episode_id) : null}
            />
          ))}
        </div>
      )}

      {/* pagination */}
      {query.hasNextPage && (
        <button className="cmt-more" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
          {query.isFetchingNextPage ? t("common.loading") : t("story.loadMoreComments")}
        </button>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function CommentCard({ c, storyId, creatorId, me, requireAuth, epNumber }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const likeComment = useLikeComment(storyId);
  const delComment = useDeleteComment(storyId);
  const reportComment = useReportComment();
  const pinComment = usePinComment(storyId);
  const addReply = useAddComment(storyId);

  const [open, setOpen] = useState(false);          // replies expanded
  const [replying, setReplying] = useState(false);  // composer open
  const [replyText, setReplyText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);  // long content
  const replies = useReplies(c.id, open);

  const [liked, setLiked] = useState(!!c.is_liked_by_me);
  const [likes, setLikes] = useState(c.likes_count || 0);
  const mine = c.is_my_comment || (me && me.id === c.author_id);
  const amCreator = me && creatorId && me.id === creatorId;
  const replyCount = replies.data?.total_count ?? c.replies_count ?? 0;

  const LONG = 300;
  const isLong = (c.content || "").length > LONG;
  const shownContent = !isLong || expanded ? c.content : c.content.slice(0, LONG).trimEnd() + "…";

  const toggleLike = () => {
    if (!requireAuth()) return;
    const was = liked;
    setLiked(!was); setLikes((n) => Math.max(0, n + (was ? -1 : 1)));
    likeComment.mutate({ id: c.id, liked: was }, {
      onError: (e) => { setLiked(was); setLikes((n) => Math.max(0, n + (was ? 1 : -1))); toast.error(errMsg(e)); },
    });
  };

  const sendReply = () => {
    if (!requireAuth()) return;
    const v = replyText.trim();
    if (!v) return;
    const done = () => { setReplyText(""); setReplying(false); setOpen(true); toast.success(t("toast.commentAdded")); };
    addReply.mutate(
      { content: v, parentCommentId: c.id, ...(c.episode_id ? { episodeId: c.episode_id } : {}) },
      {
        onSuccess: done,
        // Reply saves even when the post-insert XP step 500s / CORS-blocks into a
        // "Network Error"; the onSettled refetch shows it, so don't false-alarm.
        onError: (e) => (writeLikelySucceeded(e) ? done() : toast.error(errMsg(e))),
      }
    );
  };

  const remove = () => {
    setMenuOpen(false);
    delComment.mutate(c.id, {
      onSuccess: () => toast.success(t("story.commentDeleted")),
      onError: (e) => toast.error(errMsg(e)),
    });
  };
  const report = () => {
    setMenuOpen(false);
    if (!requireAuth()) return;
    reportComment.mutate({ id: c.id, reason: "inappropriate" }, {
      onSuccess: () => toast.success(t("report.done")),
      onError: (e) => toast.error(errMsg(e)),
    });
  };
  const togglePin = () => {
    setMenuOpen(false);
    pinComment.mutate({ id: c.id, pinned: c.is_pinned }, {
      onSuccess: () => toast.success(c.is_pinned ? t("story.unpinned") : t("story.pinnedDone")),
      onError: (e) => toast.error(errMsg(e)),
    });
  };

  // reply to a reply → same thread, @mention prefilled (YouTube pattern)
  const replyTo = (username) => {
    if (!requireAuth()) return;
    setReplying(true);
    setReplyText((v) => (v.startsWith(`@${username}`) ? v : `@${username} ${v}`));
  };

  return (
    <div className={`cmt-item ${c.is_pinned ? "pinned" : ""}`}>
      {/* avatar column — the thread rail lives here */}
      <div className="cmt-avacol">
        <Link to={`/u/${c.author_username}`} style={{ flexShrink: 0, lineHeight: 0 }}>
          <Img path={c.author_avatar_url} seed={c.author_username} kind="avatar" alt=""
            style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
        </Link>
        {open && replyCount > 0 && (
          <button className="cmt-rail" onClick={() => setOpen(false)} aria-label={t("story.hideReplies")} />
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        {/* meta row */}
        <div className="between" style={{ gap: 6 }}>
          <div className="row" style={{ gap: 6, minWidth: 0, flexWrap: "wrap", rowGap: 3 }}>
            <Link to={`/u/${c.author_username}`} className="clamp-1"
              style={{ fontWeight: 750, fontSize: 13.5, color: "var(--cmt-text)" }}>
              {c.author_display_name || c.author_username}
            </Link>
            {/* ★ the rating this reader gave the story — right beside the name */}
            {c.user_rating > 0 && <RatingBadge n={c.user_rating} label={t("story.ratedStars", { n: c.user_rating })} />}
            {c.author_is_creator && <span className="cmt-chip crimson">{t("story.creator")}</span>}
            {c.is_pinned && <span className="cmt-chip gold"><Pin size={10} /> {t("story.pinned")}</span>}
            {epNumber && (
              <button className="cmt-chip ep" title={t("story.goToEpisode")}
                onClick={() => nav(`/read/${storyId}/${c.episode_id}`)}>
                <Layers size={10} /> EP {epNumber}
              </button>
            )}
            <span style={{ fontSize: 11, color: "var(--cmt-faint)" }}>{timeAgo(c.created_at)}</span>
          </div>

          {/* kebab */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button className="cmt-kebab" onClick={() => setMenuOpen((v) => !v)} aria-label="More">
              <MoreVertical size={15} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <motion.div key="bd" className="cmt-menu-bd"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setMenuOpen(false)} />
                  <motion.div key="menu" className="cmt-menu"
                    initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.16 }}>
                    {amCreator && !c.parent_comment_id && (
                      <button onClick={togglePin} className="row gap-8">
                        {c.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                        {c.is_pinned ? t("story.unpinComment") : t("story.pinComment")}
                      </button>
                    )}
                    {mine ? (
                      <button onClick={remove} className="row gap-8" style={{ color: "var(--error)" }}>
                        <Trash2 size={14} /> {t("story.deleteComment")}
                      </button>
                    ) : (
                      <button onClick={report} className="row gap-8">
                        <Flag size={14} /> {t("story.reportComment")}
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* content */}
        <div className="cmt-body">{shownContent}</div>
        {isLong && (
          <button className="cmt-readmore" onClick={() => setExpanded((v) => !v)}>
            {expanded ? t("story.showLess") : t("story.readMore")}
          </button>
        )}

        {/* actions */}
        <div className="row" style={{ gap: 4, marginTop: 4 }}>
          <motion.button whileTap={{ scale: 1.25 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className={`cmt-act ${liked ? "on" : ""}`} onClick={toggleLike}>
            <Heart size={14} fill={liked ? "currentColor" : "none"} />
            {likes > 0 ? compact(likes) : t("story.like")}
          </motion.button>
          <button className="cmt-act" onClick={() => setReplying((v) => !v)}>
            <CornerDownRight size={14} /> {t("story.reply")}
          </button>
          {replyCount > 0 && (
            <button className={`cmt-act toggle ${open ? "open" : ""}`} onClick={() => setOpen((v) => !v)}>
              <ChevronDown size={14} className="cmt-chev" />
              {open ? t("story.hideReplies") : t("story.replies", { n: compact(replyCount) })}
            </button>
          )}
        </div>

        {/* reply composer */}
        <AnimatePresence initial={false}>
          {replying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "hidden" }}>
              <div className="row gap-8" style={{ marginTop: 8, alignItems: "center" }}>
                <input
                  className="cmt-replyinput"
                  placeholder={t("story.writeReply")}
                  value={replyText}
                  autoFocus
                  maxLength={1000}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                />
                <button className="cmt-post" style={{ height: 36 }} onClick={sendReply}
                  disabled={addReply.isPending || !replyText.trim()} aria-label={t("story.reply")}>
                  <Send size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* replies thread */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "hidden" }}>
              <div className="cmt-replies">
                {replies.isLoading ? (
                  <div style={{ fontSize: 12, color: "var(--cmt-faint)", padding: "8px 0 2px" }}>{t("common.loading")}</div>
                ) : (
                  (replies.data?.items || []).map((r) => (
                    <ReplyRow key={r.id} r={r} parentId={c.id} storyId={storyId} me={me}
                      requireAuth={requireAuth} onReply={() => replyTo(r.author_username)} />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ReplyRow({ r, parentId, storyId, me, requireAuth, onReply }) {
  const { t } = useTranslation();
  const likeComment = useLikeComment(storyId);
  const delComment = useDeleteComment(storyId);
  const reportComment = useReportComment();
  const [menuOpen, setMenuOpen] = useState(false);
  const [liked, setLiked] = useState(!!r.is_liked_by_me);
  const [likes, setLikes] = useState(r.likes_count || 0);
  const mine = r.is_my_comment || (me && me.id === r.author_id);

  const toggleLike = () => {
    if (!requireAuth()) return;
    const was = liked;
    setLiked(!was); setLikes((n) => Math.max(0, n + (was ? -1 : 1)));
    likeComment.mutate({ id: r.id, liked: was, parentId }, {
      onError: (e) => { setLiked(was); setLikes((n) => Math.max(0, n + (was ? 1 : -1))); toast.error(errMsg(e)); },
    });
  };
  const remove = () => {
    setMenuOpen(false);
    delComment.mutate({ id: r.id, parentId }, {
      onSuccess: () => toast.success(t("story.commentDeleted")),
      onError: (e) => toast.error(errMsg(e)),
    });
  };
  const report = () => {
    setMenuOpen(false);
    if (!requireAuth()) return;
    reportComment.mutate({ id: r.id, reason: "inappropriate" }, {
      onSuccess: () => toast.success(t("report.done")),
      onError: (e) => toast.error(errMsg(e)),
    });
  };

  return (
    <div className="cmt-reply">
      <Link to={`/u/${r.author_username}`} style={{ flexShrink: 0, lineHeight: 0 }}>
        <Img path={r.author_avatar_url} seed={r.author_username} kind="avatar" alt=""
          style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
      </Link>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="between" style={{ gap: 6 }}>
          <div className="row" style={{ gap: 6, minWidth: 0, flexWrap: "wrap", rowGap: 2 }}>
            <Link to={`/u/${r.author_username}`} className="clamp-1"
              style={{ fontWeight: 750, fontSize: 12.5, color: "var(--cmt-text)" }}>
              {r.author_display_name || r.author_username}
            </Link>
            {r.user_rating > 0 && <RatingBadge n={r.user_rating} small label={t("story.ratedStars", { n: r.user_rating })} />}
            {r.is_creator_reply && <span className="cmt-chip crimson">{t("story.creator")}</span>}
            <span style={{ fontSize: 10.5, color: "var(--cmt-faint)" }}>{timeAgo(r.created_at)}</span>
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button className="cmt-kebab" onClick={() => setMenuOpen((v) => !v)} aria-label="More">
              <MoreVertical size={13} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <motion.div key="bd" className="cmt-menu-bd"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setMenuOpen(false)} />
                  <motion.div key="menu" className="cmt-menu"
                    initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.16 }}>
                    {mine ? (
                      <button onClick={remove} className="row gap-8" style={{ color: "var(--error)" }}>
                        <Trash2 size={14} /> {t("story.deleteComment")}
                      </button>
                    ) : (
                      <button onClick={report} className="row gap-8">
                        <Flag size={14} /> {t("story.reportComment")}
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="cmt-body" style={{ fontSize: 13 }}>{r.content}</div>
        <div className="row" style={{ gap: 4, marginTop: 2 }}>
          <motion.button whileTap={{ scale: 1.25 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className={`cmt-act ${liked ? "on" : ""}`} onClick={toggleLike}>
            <Heart size={13} fill={liked ? "currentColor" : "none"} />
            {likes > 0 ? compact(likes) : t("story.like")}
          </motion.button>
          <button className="cmt-act" onClick={onReply}>
            <CornerDownRight size={13} /> {t("story.reply")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** 5 tiny stars, first n lit gold — the rating this reader gave the story. */
function RatingBadge({ n, small = false, label }) {
  const sz = small ? 8 : 9;
  return (
    <span className="cmt-stars" title={label} aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={sz}
          fill={i <= n ? "var(--gold)" : "none"}
          color={i <= n ? "var(--gold)" : "var(--cmt-faint)"}
          strokeWidth={i <= n ? 0 : 1.8} />
      ))}
    </span>
  );
}
