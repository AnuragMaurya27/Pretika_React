import { senderColor } from "./chatStorySchema";

/** TypingIndicator — the animated three-dot "…" bubble (received side). */
export default function TypingIndicator({ sender, group = false }) {
  const named = group && sender && sender !== "them" && sender !== "me";
  return (
    <div className="cht-row them">
      <div style={{ display: "grid", gap: 2 }}>
        {named && (
          <span className="cht-sender" style={{ color: senderColor(sender), paddingLeft: 4 }}>
            {sender}
          </span>
        )}
        <div className="cht-typing-bubble" aria-label={`${named ? sender : "Contact"} is typing`}>
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}
