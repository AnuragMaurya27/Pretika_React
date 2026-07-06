// Local reading progress — mirrors the Flutter reader (SharedPreferences
// `pretika_progress_<storyId>`). No backend; the profile reading-history
// list is derived from these entries, same as the app.
const PREFIX = "pretika_progress_";

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
    localStorage.setItem(PREFIX + storyId, JSON.stringify(merged));
  } catch {
    /* storage full / disabled — ignore */
  }
}

export function getProgress(storyId) {
  try {
    const raw = localStorage.getItem(PREFIX + storyId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// All progress entries, newest first — used by the profile reading-history view.
export function getAllProgress() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
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
    localStorage.removeItem(PREFIX + storyId);
  } catch {
    /* ignore */
  }
}
