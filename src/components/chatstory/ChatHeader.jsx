import { ArrowLeft, Phone, Video } from "lucide-react";
import Img from "../Img";

/**
 * ChatHeader — contact identity + presence line. Everything here is driven by
 * the live header state from RevealController, so meta `contact` / `presence`
 * entries can silently rewrite it mid-story.
 * `children` = player chrome (sound/autoplay toggles) so the row stays one bar.
 */
export default function ChatHeader({ contactName, contactAvatar, statusText, onBack, children }) {
  const isTyping = /typing/i.test(statusText || "");
  return (
    <div className="cht-header">
      <button className="cht-iconbtn" onClick={onBack} aria-label="Back">
        <ArrowLeft size={21} />
      </button>
      <Img
        path={contactAvatar}
        seed={contactName}
        kind="avatar"
        alt=""
        className="cht-avatar"
      />
      <div className="cht-header-names" style={{ marginLeft: 10 }}>
        <div className="cht-header-title clamp-1">{contactName}</div>
        {statusText ? (
          <div className={`cht-header-sub clamp-1${isTyping ? " is-typing" : ""}`}>{statusText}</div>
        ) : null}
      </div>
      {children || (
        <>
          <span className="cht-iconbtn" aria-hidden="true"><Video size={20} /></span>
          <span className="cht-iconbtn" aria-hidden="true"><Phone size={19} /></span>
        </>
      )}
    </div>
  );
}
