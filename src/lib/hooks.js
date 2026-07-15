import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { get, post, put, del } from "./api";

/* ----------------------------- Categories ------------------------------- */
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => get("/stories/categories"),
    staleTime: 1000 * 60 * 30,
  });
}

/* ------------------------------- Stories -------------------------------- */
export function useStories(params = {}) {
  const merged = { page: 1, page_size: 20, ...params };
  // Content-language filtering was removed — every story shows regardless of its
  // language (hindi/english/hinglish). Callers may still pass an explicit
  // `language`, but by default none is sent.
  if (merged.language == null) delete merged.language;
  return useQuery({
    queryKey: ["stories", merged],
    queryFn: () => get("/stories", { params: merged }),
    keepPreviousData: true,
  });
}

export function useUserProfile(username, enabled = true) {
  return useQuery({
    queryKey: ["user", username],
    queryFn: () => get(`/users/${username}`),
    enabled: !!username && enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/* ------------------------- Followers / Following ------------------------ */
// Both endpoints are public (no auth required) and return a paged
// FollowUserResponse list. We pull up to 100 so the in-sheet search can filter
// client-side without extra round-trips.
export function useFollowers(userId, enabled = true) {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: () => get(`/users/${userId}/followers`, { params: { page_size: 100 } }),
    enabled: !!userId && enabled,
    staleTime: 1000 * 60,
  });
}
export function useFollowing(userId, enabled = true) {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: () => get(`/users/${userId}/following`, { params: { page_size: 100 } }),
    enabled: !!userId && enabled,
    staleTime: 1000 * 60,
  });
}

// Public list of a creator's published stories (by their user id).
export function useCreatorStories(creatorId, enabled = true) {
  return useQuery({
    queryKey: ["creator-stories", creatorId],
    queryFn: () => get(`/stories/creator/${creatorId}`, { params: { page_size: 30 } }),
    enabled: !!creatorId && enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export function useStoryDetail(slug) {
  return useQuery({
    queryKey: ["story", slug],
    queryFn: () => get(`/stories/${slug}`),
    enabled: !!slug,
  });
}

export function useEpisode(storyId, episodeId) {
  return useQuery({
    queryKey: ["episode", storyId, episodeId],
    queryFn: () => get(`/stories/${storyId}/episodes/${episodeId}`),
    enabled: !!storyId && !!episodeId,
  });
}

export function useComments(storyId) {
  return useQuery({
    queryKey: ["comments", storyId],
    queryFn: () => get(`/stories/${storyId}/comments`, { params: { page_size: 50 } }),
    enabled: !!storyId,
  });
}

// Paged top-level comments for the CommentSection. The API has no episode
// filter, so episode views filter the loaded pages client-side (each comment
// carries its episode_id). Key shares the ["comments", storyId] prefix so the
// existing add/like/delete invalidations refresh it too.
export function useCommentsInfinite(storyId) {
  return useInfiniteQuery({
    queryKey: ["comments", storyId, "list"],
    queryFn: ({ pageParam }) =>
      get(`/stories/${storyId}/comments`, { params: { page: pageParam, page_size: 30 } }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.has_next_page ? (last.page || 1) + 1 : undefined),
    enabled: !!storyId,
  });
}

export function useBookmarked(enabled = true) {
  return useQuery({
    queryKey: ["bookmarked"],
    queryFn: () => get("/stories/bookmarked", { params: { page_size: 30 } }),
    enabled,
  });
}

/* ------------------------------- Search --------------------------------- */
export function useSearch(q, type = "all") {
  return useQuery({
    queryKey: ["search", q, type],
    queryFn: () =>
      get("/search", { params: { q, search_type: type, page_size: 20 } }),
    enabled: !!q && q.trim().length > 1,
  });
}

/* ------------------------------ Announcements --------------------------- */
export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: () => get("/announcements"),
    staleTime: 1000 * 60 * 10,
  });
}

/* ------------------------------ Notifications --------------------------- */
// All endpoints are [Authorize] — only enable when logged in. The badge polls
// on an interval (no websockets) so it stays fresh; the list fetches lazily
// when the panel opens.
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ["notif-unread"],
    queryFn: () => get("/notifications/unread-count"),
    enabled,
    refetchInterval: enabled ? 60_000 : false, // near-real-time badge
    staleTime: 30_000,
  });
}

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => get("/notifications", { params: { page: 1, page_size: 30 } }),
    enabled,
    staleTime: 10_000,
  });
}

export function useMarkNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => post(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-unread"] });
    },
  });
}

export function useMarkAllNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post("/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-unread"] });
    },
  });
}

export function useDeleteNotif() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-unread"] });
    },
  });
}

/* --------------------------- Leaderboard creators ----------------------- */
export function useTopCreators() {
  return useQuery({
    queryKey: ["leaderboard", "all_time"],
    queryFn: () => get("/leaderboard/all_time").catch(() => []),
    staleTime: 1000 * 60 * 30,
  });
}

/* ------------------------------ Mutations ------------------------------- */
export function useLikeStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }) =>
      liked ? del(`/stories/${id}/like`) : post(`/stories/${id}/like`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["story"] });
      qc.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useBookmarkStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, saved }) =>
      saved ? del(`/stories/${id}/bookmark`) : post(`/stories/${id}/bookmark`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["story"] });
      qc.invalidateQueries({ queryKey: ["bookmarked"] });
    },
  });
}

export function useAddComment(storyId) {
  const qc = useQueryClient();
  return useMutation({
    // accepts a plain string (top-level comment) or { content, parentCommentId, episodeId }
    mutationFn: (arg) => {
      const { content, parentCommentId, episodeId } =
        typeof arg === "string" ? { content: arg } : arg;
      return post(`/stories/${storyId}/comments`, {
        story_id: storyId,
        content,
        ...(parentCommentId ? { parent_comment_id: parentCommentId } : {}),
        ...(episodeId ? { episode_id: episodeId } : {}),
      });
    },
    // Reconcile on settled — success OR error. The backend saves the comment
    // BEFORE a non-transactional XP update that can 500 (reader_rank enum bug),
    // so the write usually lands even when the request "fails"; refetching either
    // way surfaces the new comment without a manual page refresh.
    onSettled: (_d, _e, arg) => {
      qc.invalidateQueries({ queryKey: ["comments", storyId] });
      const parentId = typeof arg === "object" ? arg.parentCommentId : null;
      if (parentId) qc.invalidateQueries({ queryKey: ["replies", parentId] });
    },
  });
}

/* ---------------------- Comment interactions --------------------------- */
// Pass parentId when acting on a reply so its thread refreshes too.
export function useLikeComment(storyId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }) =>
      liked ? del(`/comments/${id}/like`) : post(`/comments/${id}/like`),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", storyId] });
      if (vars?.parentId) qc.invalidateQueries({ queryKey: ["replies", vars.parentId] });
    },
  });
}

export function useDeleteComment(storyId) {
  const qc = useQueryClient();
  return useMutation({
    // accepts a plain id or { id, parentId } for replies
    mutationFn: (arg) => del(`/comments/${typeof arg === "string" ? arg : arg.id}`),
    onSuccess: (_d, arg) => {
      qc.invalidateQueries({ queryKey: ["comments", storyId] });
      const parentId = typeof arg === "object" ? arg.parentId : null;
      if (parentId) qc.invalidateQueries({ queryKey: ["replies", parentId] });
    },
  });
}

// Story creator pins/unpins a comment to the top of the list.
export function usePinComment(storyId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pinned }) =>
      pinned
        ? del(`/stories/${storyId}/comments/${id}/pin`)
        : post(`/stories/${storyId}/comments/${id}/pin`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", storyId] }),
  });
}

export function useReportComment() {
  return useMutation({
    mutationFn: ({ id, reason, customReason }) =>
      post(`/comments/${id}/report`, { reason, custom_reason: customReason }),
  });
}

export function useReplies(commentId, enabled = false) {
  return useQuery({
    queryKey: ["replies", commentId],
    queryFn: () => get(`/comments/${commentId}/replies`, { params: { page_size: 50 } }),
    enabled: !!commentId && enabled,
  });
}

/* ------------------------- Ratings & completion ------------------------- */
export function useRateStory(slug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating }) => post(`/stories/${id}/rate`, { rating }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["story", slug] });
      qc.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useRateEpisode(storyId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ episodeId, rating }) =>
      post(`/stories/${storyId}/episodes/${episodeId}/rate`, { rating }),
    onSuccess: (_d, { episodeId }) =>
      qc.invalidateQueries({ queryKey: ["episode", storyId, episodeId] }),
  });
}

export function useCompleteEpisode() {
  return useMutation({
    mutationFn: ({ storyId, episodeId }) =>
      post(`/stories/${storyId}/episodes/${episodeId}/complete`),
  });
}

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, following }) =>
      following ? del(`/users/${id}/follow`) : post(`/users/${id}/follow`),
    // Optimistically flip is_following on every cached profile of this user.
    // Profiles are keyed by USERNAME (["user", username]) but we only have the
    // id here, so match on the id inside the cached data. Without this the
    // 5-min staleTime kept serving the pre-toggle is_following, so the button
    // showed "Following" after an unfollow (and vice-versa) on revisit.
    onMutate: async ({ id, following }) => {
      await qc.cancelQueries({ queryKey: ["user"] });
      const prev = [];
      qc.getQueriesData({ queryKey: ["user"] }).forEach(([key, data]) => {
        if (data?.id === id) {
          prev.push([key, data]);
          qc.setQueryData(key, {
            ...data,
            is_following: !following,
            total_followers: Math.max(0, (data.total_followers || 0) + (following ? -1 : 1)),
          });
        }
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data)),
    // Refetch from the server so the cache reflects the truth after the write.
    onSettled: (_d, _e, { id }) => {
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["followers", id] });
      qc.invalidateQueries({ queryKey: ["following"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

/* ---------------------------- Darr Meter --------------------------------- */
// Paragraph-level fear heatmap (reading stories only, not chat stories).
export function useFearStats(episodeId) {
  return useQuery({
    queryKey: ["darr-meter", episodeId],
    queryFn: () => get(`/darr-meter/${episodeId}`),
    enabled: !!episodeId,
    staleTime: 1000 * 60, // heatmap freshness — a minute is plenty
    refetchOnWindowFocus: false,
  });
}

/* --------------------------- Chat stories -------------------------------- */
// Found-footage phone-chat horror (Pretika official only can publish).
export function useChatStories(params = {}) {
  const merged = { page: 1, page_size: 20, ...params };
  return useQuery({
    queryKey: ["chat-stories", merged],
    queryFn: () => get("/chat-stories", { params: merged }),
    staleTime: 1000 * 60 * 2,
  });
}

export function useChatStory(slug) {
  return useQuery({
    queryKey: ["chat-story", slug],
    queryFn: () => get(`/chat-stories/${slug}`),
    enabled: !!slug,
  });
}

// Editor-only fetch (drafts included) — server enforces the Pretika gate.
export function useChatStoryById(id) {
  return useQuery({
    queryKey: ["chat-story-id", id],
    queryFn: () => get(`/chat-stories/by-id/${id}`),
    enabled: !!id,
  });
}

export function useCanPublishChatStories(enabled = true) {
  return useQuery({
    queryKey: ["chat-stories-can-publish"],
    queryFn: () => get("/chat-stories/can-publish").catch(() => false),
    enabled,
    staleTime: 1000 * 60 * 30,
  });
}

export function useMyChatStories(enabled = true) {
  return useQuery({
    queryKey: ["my-chat-stories"],
    queryFn: () => get("/chat-stories/mine", { params: { page_size: 50 } }),
    enabled,
  });
}

export function useSaveChatStory() {
  const qc = useQueryClient();
  return useMutation({
    // payload is the snake_case create/update body; pass `id` to update
    mutationFn: ({ id, ...payload }) =>
      id ? put(`/chat-stories/${id}`, payload) : post("/chat-stories", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-stories"] });
      qc.invalidateQueries({ queryKey: ["my-chat-stories"] });
      qc.invalidateQueries({ queryKey: ["chat-story"] });
    },
  });
}

export function useDeleteChatStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/chat-stories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-stories"] });
      qc.invalidateQueries({ queryKey: ["my-chat-stories"] });
    },
  });
}

/* ----------------------------- Creator ---------------------------------- */
export function useCreatorStats(enabled = true) {
  return useQuery({ queryKey: ["creator-stats"], queryFn: () => get("/creator/stats"), enabled });
}
export function useCreatorEarnings(enabled = true) {
  return useQuery({ queryKey: ["creator-earnings"], queryFn: () => get("/creator/earnings"), enabled });
}
export function useMyStories(enabled = true) {
  return useQuery({ queryKey: ["my-stories"], queryFn: () => get("/stories/my", { params: { page_size: 30 } }), enabled });
}

/* ----------------------------- Support ----------------------------------- */
// Reader & creator help-desk — /api/support (categories, tickets, messages).
export function useSupportCategories() {
  return useQuery({
    queryKey: ["support-categories"],
    queryFn: () => get("/support/categories"),
    staleTime: 1000 * 60 * 30,
  });
}

export function useMyTickets(status) {
  return useQuery({
    queryKey: ["support-tickets", status || "all"],
    queryFn: () => get("/support/tickets", { params: { status: status || undefined, page_size: 50 } }),
  });
}

export function useTicket(id) {
  return useQuery({
    queryKey: ["support-ticket", id],
    queryFn: () => get(`/support/tickets/${id}`),
    enabled: !!id,
  });
}

export function useTicketMessages(id) {
  return useQuery({
    queryKey: ["support-ticket-messages", id],
    queryFn: () => get(`/support/tickets/${id}/messages`),
    enabled: !!id,
    refetchInterval: 30000, // light polling so support replies show up
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => post("/support/tickets", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support-tickets"] }),
  });
}

export function useAddTicketMessage(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message) => post(`/support/tickets/${id}/messages`, { message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-ticket-messages", id] });
      qc.invalidateQueries({ queryKey: ["support-ticket", id] });
    },
  });
}

export function useCloseTicket(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post(`/support/tickets/${id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-ticket", id] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
}

export function useRateTicket(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rating, feedback }) => post(`/support/tickets/${id}/rate`, { rating, feedback }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-ticket", id] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
}

/* ------------------------------ Reports ---------------------------------- */
// User-side content report — POST /api/search/reports
// entity_type: story|episode|user|comment; reason: inappropriate|spam|
// hate_speech|adult_content|copyright|misinformation|other
export function useCreateReport() {
  return useMutation({
    mutationFn: ({ entity_type, entity_id, reason, description }) =>
      post("/search/reports", { entity_type, entity_id, reason, description }),
  });
}
