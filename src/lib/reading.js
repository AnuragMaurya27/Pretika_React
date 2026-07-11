// Local reading progress — mirrors the Flutter reader (SharedPreferences
// `pretika_progress_<storyId>`). No backend; the profile reading-history
// list is derived from these entries, same as the app.
//
// PRIVACY: entries are namespaced by the current user id so reading history
// never leaks across accounts sharing one browser. Keys are
// `pretika_progress_<userId|guest>_<storyId>`; getAllProgress only returns the
// entries belonging to whoever is signed in right now.
import { STORAGE } from "./constants";

const BASE = "pretika_progress_";

// Owner segment for progress keys: the logged-in user id, or "guest" when
// anonymous. Read live so it always matches the current session.
function owner() {
  try {
    return localStorage.getItem(STORAGE.userId) || "guest";
  } catch {
    return "guest";
  }
}
const keyFor = (storyId) => `${BASE}${owner()}_${storyId}`;
const ownerPrefix = () => `${BASE}${owner()}_`;

export function saveProgress(storyId, data) {
  if (!storyId) return;
  try {
    const prev = getProgress(storyId) || {};
    const merged = {
      story_id: storyId,
      ...prev,
      ...data,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(keyFor(storyId), JSON.stringify(merged));
  } catch {
    /* storage full / disabled — ignore */
  }
}

export function getProgress(storyId) {
  try {
    const raw = localStorage.getItem(keyFor(storyId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// All progress entries for the CURRENT user, newest first — used by the profile
// reading-history view.
export function getAllProgress() {
  const out = [];
  const prefix = ownerPrefix();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        try {
          out.push(JSON.parse(localStorage.getItem(k)));
        } catch {
          /* skip corrupt */
        }
      }
    }
  } catch {
    /* ignore */
  }
  return out
    .filter(Boolean)
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
}

export function clearProgress(storyId) {
  try {
    localStorage.removeItem(keyFor(storyId));
  } catch {
    /* ignore */
  }
}
