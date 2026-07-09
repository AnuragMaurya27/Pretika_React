/**
 * Client-side "trending" ranking.
 *
 * The API exposes `sort_by=trending`, but it orders by a `trending_score`
 * column the backend never actually computes — so every story scores 0 and
 * "trending" silently collapses to newest-first. Until the backend populates
 * that column, we rank trending on the client from the engagement signals the
 * list endpoint already returns (views / likes / comments / bookmarks / rating)
 * combined with recency, so the section reflects what is genuinely hot right now.
 *
 * Formula: a Hacker-News-style time decay —
 *   score = (weightedEngagement + 1) / (ageHours + 2) ^ GRAVITY
 * Active signals (likes, comments, saves) are weighted above passive views, and
 * GRAVITY controls how fast older stories fade so fresh-but-engaged stories rise.
 */

const GRAVITY = 0.6;

export function trendingScore(s, now = Date.now()) {
  const views = s.total_views || 0;
  const likes = s.total_likes || 0;
  const comments = s.total_comments || 0;
  const bookmarks = s.total_bookmarks || 0;
  const rating = (s.average_rating || 0) * (s.rating_count || 0);

  // active engagement counts for more than a passive view
  const engagement = views + likes * 4 + comments * 6 + bookmarks * 3 + rating * 3;

  const published = s.published_at ? new Date(s.published_at).getTime() : now;
  const ageHours = Math.max(0, (now - published) / 3.6e6);

  return (engagement + 1) / Math.pow(ageHours + 2, GRAVITY);
}

/**
 * Rank a pool of stories by live trending score, highest first.
 * @param {Array} stories  candidate stories (published)
 * @param {number} limit   how many to return
 */
export function rankTrending(stories = [], limit = 12) {
  const now = Date.now();
  return stories
    .filter((s) => s && (s.status ? s.status === "published" : true))
    .map((s) => ({ s, k: trendingScore(s, now) }))
    .sort((a, b) => b.k - a.k)
    .slice(0, limit)
    .map((x) => x.s);
}
