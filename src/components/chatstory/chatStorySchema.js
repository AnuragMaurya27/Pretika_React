/**
 * ============================================================================
 * CHAT STORY — authoring schema
 * ============================================================================
 * A chat story is a JSON script that the ChatStoryReader plays back as a
 * realistic phone conversation. Writers author ONLY this JSON — no code.
 *
 * STORY FIELDS
 *   id             string   — unique id/slug for the story.
 *   title          string   — display title (used on the browse page, not
 *                             inside the phone UI).
 *   contactName    string   — name shown in the chat header ("Maa", "Unknown").
 *   contactAvatar  string   — avatar URL/path; empty → generated fallback.
 *   chatType       string   — "individual" (2 people) or "group".
 *   statusText     string   — initial header presence line. Default "online".
 *                             ("last seen today at 11:40 PM", "online", …)
 *   messages       array    — the script, played strictly in order.
 *
 * MESSAGE FIELDS (every entry needs a unique `id` and a `type`)
 *   type: "text" — a normal bubble.
 *     sender   "me" (right, green) | "them" (left, white). In a group chat,
 *              any other string ("Rohit") renders as that named member with
 *              an auto-assigned per-sender colour label.
 *     text     the message body. Newlines allowed.
 *     time     display timestamp string ("11:42 PM"). Purely visual.
 *     status   (sender "me" only) final tick state, animated in steps:
 *              "sent" ✓ gray → "delivered" ✓✓ gray → "seen" ✓✓ blue.
 *              Default "seen".
 *              "seen_wrong" — THE signature wrongness detail: the seen-ticks
 *              slowly bleed to a dull crimson. Use it ONCE per story, at the
 *              scripted moment things stop being okay. One detail, used
 *              sparingly, lands harder than several.
 *
 *   type: "typing" — animated three-dot bubble.
 *     sender      who is typing (usually "them" / a group member name).
 *     durationMs  how long the dots run (800–8000ms) before the NEXT message
 *                 in the script auto-reveals. Long pauses = dread.
 *
 *   type: "system" — centered gray line ("Maa left the chat",
 *     "Messages are end-to-end encrypted", "Aaj 11:40 PM").
 *     text     the line to show.
 *
 *   type: "missed_call" — call-log style entry.
 *     callerName  who called ("Maa").
 *     count       number of missed calls (e.g. 4 → "4 missed calls").
 *     time        display time ("3:14 AM").
 *
 *   META ENTRIES (invisible; they apply instantly and never pause playback)
 *   type: "presence" — changes the header presence line mid-story.
 *     text     new line ("typing…", "last seen at 3:14 AM", "" hides it).
 *   type: "contact" — silently changes the header identity mid-story
 *     (the "someone else is holding the phone now" move — also use sparingly).
 *     contactName    new name  (optional)
 *     contactAvatar  new avatar (optional; "" clears it)
 *
 *   OPTIONAL (any renderable entry)
 *   pauseMs   autoplay-only: override the delay before this entry appears.
 * ============================================================================
 */

/** Sample story — the spec's example, used by the /chat-stories/demo page. */
export const SAMPLE_CHAT_STORY = {
  id: "example-story",
  title: "Maa — Demo",
  contactName: "Maa",
  contactAvatar: "",
  chatType: "individual",
  statusText: "online",
  messages: [
    { id: 1, sender: "them", type: "text", text: "Beta so gyi kya", time: "11:42 PM" },
    { id: 2, sender: "me", type: "text", text: "Nahi Maa, jaag rahi hoon", time: "11:43 PM", status: "seen" },
    { id: 3, sender: "them", type: "typing", durationMs: 3000 },
    { id: 4, sender: "them", type: "text", text: "Maine toh kaha tha so jaana...", time: "11:47 PM" },
    { id: 5, type: "system", text: "Maa left the chat" },
    { id: 6, sender: "me", type: "missed_call", callerName: "Maa", count: 4, time: "3:14 AM" },
  ],
};

/** Renderable = takes a slot in the conversation column. */
export const RENDERABLE_TYPES = new Set(["text", "system", "missed_call"]);
/** Meta = applied silently to the header, never shown or paused on. */
export const META_TYPES = new Set(["presence", "contact"]);

/** Per-sender name colours for group chats (readable on white bubbles). */
const SENDER_COLORS = [
  "#0c7abf", "#a1650f", "#3d8f4c", "#c4423b",
  "#7a5fb5", "#c2447f", "#2e8b8b", "#b05c2a",
];
export function senderColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SENDER_COLORS[h % SENDER_COLORS.length];
}

/**
 * Adapt an API chat-story row (snake_case envelope) to the authored
 * camelCase schema the reader components consume. The `messages` array is
 * stored as-authored in JSONB, so it passes through untouched.
 */
export function normalizeChatStory(apiStory) {
  if (!apiStory) return null;
  return {
    id: apiStory.slug || apiStory.id,
    title: apiStory.title,
    description: apiStory.description,
    contactName: apiStory.contact_name || "Unknown",
    contactAvatar: apiStory.contact_avatar || "",
    chatType: apiStory.chat_type || "individual",
    statusText: apiStory.status_text ?? "online",
    messages: Array.isArray(apiStory.messages) ? apiStory.messages : [],
  };
}
