import { useEffect, useRef } from "react";

// A lightweight, self-contained emoji picker for the chat composer. Emojis go
// into the message as plain text (Unicode) — no backend, no message type needed.
// Grouped so the horror set the platform leans on is one tap away.
const GROUPS = [
  { key: "smileys", emojis: ["😀","😁","😂","🤣","😊","😇","🙂","😉","😍","😘","😜","🤪","🤔","🤨","😐","😑","🙄","😴","😌","😔","😅","😮","😯","😲","🥺","😢","😭","😤","😡","🤬"] },
  { key: "horror",  emojis: ["👻","💀","☠️","🎃","👹","👺","😈","👿","🧟","🧛","🧙","🕷️","🕸️","🦇","🐍","🐺","🌙","🕯️","⚰️","🪦","🔪","🩸","😱","😨","😰","🥶","👁️","🫣","🌚","🔦"] },
  { key: "gestures",emojis: ["👍","👎","👏","🙏","🤝","💪","✌️","🤞","👌","🤙","👋","🫡","🤗","🫶","👀","🙈","🙉","🙊"] },
  { key: "hearts",  emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❤️‍🔥","💕","💗","💖","✨","🔥","⭐","🌟","💯"] },
];

export default function EmojiPicker({ onPick, onClose }) {
  const ref = useRef(null);

  // Tap outside closes; the composer's own emoji button toggles it separately.
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest?.(".chat-emoji-btn")) {
        onClose?.();
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [onClose]);

  return (
    <div className="emoji-panel" ref={ref} role="dialog" aria-label="Emoji">
      {GROUPS.map((g) => (
        <div key={g.key} className="emoji-group">
          {g.emojis.map((e) => (
            <button key={e} type="button" className="emoji-cell" onClick={() => onPick(e)}>{e}</button>
          ))}
        </div>
      ))}
    </div>
  );
}
