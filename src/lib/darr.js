// Darr Meter — client-side session + dedup helpers.
// The backend dedups too (unique constraints); these just avoid useless
// round-trips and keep the UI honest within a browser session.

const SESSION_KEY = "pretika_darr_session";

/** Stable per-browser-session id (spec: dedup is per session). */
export function darrSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function readSet(key) {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}
function writeSet(key, set) {
  sessionStorage.setItem(key, JSON.stringify([...set]));
}

/** Paragraphs already reported as viewed this session (per episode). */
export function seenParagraphs(episodeId) {
  return readSet(`darr_seen_${episodeId}`);
}
export function markSeen(episodeId, ids) {
  const set = seenParagraphs(episodeId);
  ids.forEach((i) => set.add(i));
  writeSet(`darr_seen_${episodeId}`, set);
}

/** Paragraphs this session already reacted to (per episode). */
export function reactedParagraphs(episodeId) {
  return readSet(`darr_done_${episodeId}`);
}
export function markReacted(episodeId, id) {
  const set = reactedParagraphs(episodeId);
  set.add(id);
  writeSet(`darr_done_${episodeId}`, set);
}
