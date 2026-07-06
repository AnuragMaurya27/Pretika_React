import { useEffect, useState } from "react";
import { senderColor } from "./chatStorySchema";

const TICK_GRAY = "#667781";
const TICK_SEEN = "#53bdeb";
// the signature wrongness: seen-ticks bleeding to a dried-blood crimson
const TICK_WRONG = "#9c1c14";

function TickIcon({ double, color }) {
  return (
    <span className="cht-ticks" aria-hidden="true">
      <svg width={double ? 17 : 13} height="12" viewBox={double ? "0 0 17 12" : "0 0 13 12"} fill="none" style={{ color }}>
        <path d="M1 6.5 4 9.5 9.5 2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        {double && (
          <path d="M7.5 8 9 9.5 14.5 2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </span>
  );
}

/**
 * Status ticks that walk sent → delivered → final with real-messenger delays.
 * `status` is the authored FINAL state ("sent" | "delivered" | "seen" |
 * "seen_wrong"); the component animates its way there.
 */
function Ticks({ status = "seen", reduceMotion }) {
  const [stage, setStage] = useState(() => (reduceMotion ? status : "sent"));

  useEffect(() => {
    if (reduceMotion) return; // initial state is already the final one
    const timers = [];
    if (status !== "sent") {
      timers.push(setTimeout(() => setStage("delivered"), 600));
      if (status !== "delivered")
        timers.push(setTimeout(() => setStage(status), 1500));
    }
    return () => timers.forEach(clearTimeout);
  }, [status, reduceMotion]);

  if (stage === "sent") return <TickIcon double={false} color={TICK_GRAY} />;
  if (stage === "delivered") return <TickIcon double color={TICK_GRAY} />;
  return <TickIcon double color={stage === "seen_wrong" ? TICK_WRONG : TICK_SEEN} />;
}

/**
 * MessageBubble — one text message.
 *   msg          the script entry ({ sender, text, time, status })
 *   group        chatType === "group" → named senders get a coloured label
 *   showSender   label only on the first bubble of a sender's run
 */
export default function MessageBubble({ msg, group = false, showSender = false, reduceMotion = false }) {
  const mine = msg.sender === "me";
  const named = group && !mine && msg.sender && msg.sender !== "them";
  return (
    <div className={`cht-row ${mine ? "me" : "them"}`}>
      <div className="cht-bubble">
        {named && showSender && (
          <span className="cht-sender" style={{ color: senderColor(msg.sender) }}>
            {msg.sender}
          </span>
        )}
        {msg.text}
        <span className="cht-meta">
          {msg.time}
          {mine && <Ticks status={msg.status} reduceMotion={reduceMotion} />}
        </span>
      </div>
    </div>
  );
}
