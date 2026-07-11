import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Volume2, VolumeX, Play, Pause, RotateCcw, Share2, ArrowLeft, History } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import SystemMessageLine from "./SystemMessageLine";
import MissedCallCard from "./MissedCallCard";
import { useRevealController, PLAY_SPEEDS } from "./RevealController";

/**
 * Muted "new message" pops, synthesized with WebAudio (no asset, no autoplay
 * violation — the context is only created inside the toggle's user gesture).
 */
function useChatSound() {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const ctxRef = useRef(null);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      enabledRef.current = next;
      if (next) {
        if (!ctxRef.current) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (Ctx) ctxRef.current = new Ctx();
        }
        ctxRef.current?.resume?.();
      }
      return next;
    });
  }, []);

  const pop = useCallback((incoming = true) => {
    const ctx = ctxRef.current;
    if (!enabledRef.current || !ctx || ctx.state !== "running") return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(incoming ? 660 : 440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(incoming ? 880 : 392, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  }, []);

  useEffect(() => () => ctxRef.current?.close?.(), []);
  return { enabled, toggle, pop };
}

function StatusBar({ time }) {
  return (
    <div className="cht-statusbar" aria-hidden="true">
      <span>{time}</span>
      <span className="row gap-6">
        {/* signal */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="4.5" width="3" height="6.5" rx="1" />
          <rect x="9" y="2" width="3" height="9" rx="1" />
          <rect x="13.5" y="0" width="2.5" height="11" rx="1" opacity=".35" />
        </svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
          <path d="M7.5 9.2 9.4 7a3 3 0 0 0-3.8 0l1.9 2.2zM7.5 11l1-1.2a1.6 1.6 0 0 0-2 0l1 1.2z" />
          <path d="M2.6 4.1A7.6 7.6 0 0 1 12.4 4l-1.3 1.5a5.6 5.6 0 0 0-7.2.1L2.6 4.1z" opacity=".85" />
          <path d="M.4 1.6a11 11 0 0 1 14.2 0L13.3 3a9 9 0 0 0-11.6.1L.4 1.6z" opacity=".55" />
        </svg>
        {/* battery */}
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
          <rect x=".5" y=".5" width="18" height="10" rx="2.5" stroke="currentColor" opacity=".5" />
          <rect x="2" y="2" width="9" height="7" rx="1.2" fill="currentColor" />
          <rect x="20" y="3.2" width="1.6" height="4.6" rx=".8" fill="currentColor" opacity=".5" />
        </svg>
      </span>
    </div>
  );
}

/**
 * ChatStoryReader — the full phone. Owns playback (RevealController), sound,
 * auto-scroll and the end-of-story overlay.
 *
 *   story    normalized chat story (see chatStorySchema.js)
 *   onExit   back-arrow / "aur kahaniyan" handler
 *   shareUrl optional absolute URL for the share button
 */
export default function ChatStoryReader({ story, onExit, shareUrl }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const sound = useChatSound();
  const onReveal = useCallback(
    (msg) => sound.pop(msg.sender !== "me"),
    [sound]
  );

  // Resume: progress is saved per story; if a reader left mid-chat we ask
  // "wahi se ya shuru se?" before anything reveals.
  const storageKey = story?.id ? `pretika_chatstory_pos_${story.id}` : null;
  const [resumeAsk, setResumeAsk] = useState(() => {
    if (!storageKey) return null;
    const saved = parseInt(localStorage.getItem(storageKey) || "0", 10);
    const total = Array.isArray(story?.messages) ? story.messages.length : 0;
    return saved > 2 && saved < total ? saved : null;
  });

  const {
    visible, typing, header, cursor, progress, done,
    mode, setMode, speed, setSpeed, advance, jumpTo, restart,
  } = useRevealController(story, {
    reduceMotion,
    onReveal,
    paused: resumeAsk != null,
  });

  // persist reading position; a finished story starts fresh next time
  useEffect(() => {
    if (!storageKey || resumeAsk != null) return;
    if (done) localStorage.removeItem(storageKey);
    else if (cursor > 0) localStorage.setItem(storageKey, String(cursor));
  }, [cursor, done, storageKey, resumeAsk]);

  const scrollRef = useRef(null);
  const [taps, setTaps] = useState(0);

  // keep the newest message on screen
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [visible.length, typing, done, reduceMotion]);

  const handleAdvance = useCallback(() => {
    if (done) return;
    setTaps((t) => t + 1);
    advance();
  }, [done, advance]);

  // keyboard: space / enter / ↓ reveal the next beat
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleAdvance]);

  const share = async (e) => {
    e.stopPropagation();
    const url = shareUrl || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: story.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t("toast.linkCopied"));
      }
    } catch { /* user dismissed the share sheet */ }
  };

  // the fake OS clock follows the story's latest timestamp — a found-footage tell
  const clock = [...visible].reverse().find((m) => m.time)?.time || "11:42 PM";
  const isGroup = story.chatType === "group";
  const showHint =
    mode === "tap" && taps < 2 && !done && visible.length > 0 && resumeAsk == null;

  const cycleSpeed = (e) => {
    e.stopPropagation();
    const next = PLAY_SPEEDS[(PLAY_SPEEDS.indexOf(speed) + 1) % PLAY_SPEEDS.length];
    setSpeed(next);
  };
  const totalBeats = Array.isArray(story?.messages) ? story.messages.length : 0;

  return (
    <div className="cht-stage">
      <div
        className="cht-phone"
        onClick={mode === "tap" ? handleAdvance : undefined}
        role={mode === "tap" ? "button" : undefined}
        tabIndex={-1}
        aria-label={mode === "tap" ? "Tap to reveal the next message" : undefined}
      >
        <StatusBar time={clock} />
        <ChatHeader
          contactName={header.contactName}
          contactAvatar={header.contactAvatar}
          statusText={header.statusText}
          onBack={(e) => { e.stopPropagation(); onExit?.(); }}
        >
          <button
            className="cht-iconbtn"
            onClick={(e) => { e.stopPropagation(); sound.toggle(); }}
            aria-label={sound.enabled ? "Mute message tones" : "Unmute message tones"}
            aria-pressed={sound.enabled}
          >
            {sound.enabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          {mode === "auto" && (
            <button
              className="cht-speed"
              onClick={cycleSpeed}
              aria-label={`Autoplay speed ${speed}x — change`}
            >
              {speed}x
            </button>
          )}
          <button
            className="cht-iconbtn"
            onClick={(e) => {
              e.stopPropagation();
              setMode(mode === "auto" ? "tap" : "auto");
            }}
            aria-label={mode === "auto" ? "Pause autoplay (tap to continue)" : "Autoplay the story"}
            aria-pressed={mode === "auto"}
          >
            {mode === "auto" ? <Pause size={19} /> : <Play size={19} />}
          </button>
        </ChatHeader>
        <div className="cht-progress" aria-hidden="true">
          <span style={{ width: `${progress * 100}%` }} />
        </div>

        <div ref={scrollRef} className="cht-scroll" aria-live="polite">
          {visible.map((m, i) => {
            if (m.type === "system") return <SystemMessageLine key={m.id ?? i} text={m.text} />;
            if (m.type === "missed_call")
              return <MissedCallCard key={m.id ?? i} callerName={m.callerName} count={m.count} time={m.time} />;
            const prev = visible[i - 1];
            return (
              <MessageBubble
                key={m.id ?? i}
                msg={m}
                group={isGroup}
                showSender={!prev || prev.type !== "text" || prev.sender !== m.sender}
                reduceMotion={reduceMotion}
              />
            );
          })}
          {typing && <TypingIndicator sender={typing.sender} group={isGroup} />}
        </div>

        {showHint && <div className="cht-hint">{t("chats.tapHint")}</div>}

        <div className="cht-footer">
          <div className="cht-composer" aria-hidden="true">
            <span style={{ flex: 1 }}>{t("chats.composer")}</span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />
            </svg>
          </div>
        </div>

        {resumeAsk != null && (
          <div className="cht-resume-scrim" onClick={(e) => e.stopPropagation()}>
            <div className="cht-resume-card">
              <span className="cht-resume-ic"><History size={22} /></span>
              <div className="cht-resume-title">{t("chats.resumeTitle")}</div>
              <div className="cht-resume-sub">
                {t("chats.resumeSub", { pct: Math.round((resumeAsk / Math.max(totalBeats, 1)) * 100) })}
              </div>
              <div className="cht-resume-btns">
                <button
                  className="cht-end-btn"
                  onClick={() => {
                    if (storageKey) localStorage.removeItem(storageKey);
                    jumpTo(0);
                    setResumeAsk(null);
                  }}
                >
                  <RotateCcw size={15} /> {t("chats.fromStart")}
                </button>
                <button
                  className="cht-end-btn primary"
                  onClick={() => {
                    jumpTo(resumeAsk);
                    setResumeAsk(null);
                  }}
                >
                  <Play size={15} /> {t("chats.resumeGo")}
                </button>
              </div>
            </div>
          </div>
        )}

        {done && (
          <div className="cht-end" onClick={(e) => e.stopPropagation()}>
            <div className="cht-end-title lang-hi">{t("chats.endTitle")}</div>
            <div className="cht-end-sub">{t("chats.endSub")}</div>
            <div className="cht-end-btns">
              <button className="cht-end-btn" onClick={() => { setTaps(0); restart(); }}>
                <RotateCcw size={15} /> {t("chats.again")}
              </button>
              <button className="cht-end-btn" onClick={share}>
                <Share2 size={15} /> {t("chats.share")}
              </button>
              <button className="cht-end-btn primary" onClick={() => onExit?.()}>
                <ArrowLeft size={15} /> {t("chats.moreStories")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
