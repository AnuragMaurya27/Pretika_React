import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { META_TYPES, RENDERABLE_TYPES } from "./chatStorySchema";

/** Autoplay speeds — multiplier on playback rate (delays divide by this). */
export const PLAY_SPEEDS = [0.5, 1, 1.5, 2];

/**
 * RevealController — headless progressive-reveal engine for chat stories.
 *
 * Consumes the authored script strictly in order and exposes:
 *   visible   script entries revealed so far (only renderable types)
 *   typing    the in-flight `typing` entry (three-dot bubble) or null
 *   header    { contactName, contactAvatar, statusText } — live header state
 *             (meta `contact` / `presence` entries mutate it mid-story)
 *   cursor    how many script entries are consumed (persist this to resume)
 *   progress  0..1 fraction of the script consumed
 *   done      true when the script is exhausted
 *   mode      "tap" | "auto" — tap-to-continue (default: the reader controls
 *             the dread) or cinematic autoplay
 *   speed     autoplay speed multiplier (PLAY_SPEEDS); setSpeed to change
 *   advance() reveal the next beat (tap/keypress). During a typing beat it
 *             fast-forwards the dots into the pending message.
 *   jumpTo(n) rewind/fast-forward instantly to script index n (resume).
 *   restart() rewind to the beginning.
 *
 * Options: { reduceMotion, onReveal, startAt, paused }
 *   startAt  initial cursor (resume from saved progress)
 *   paused   while true nothing reveals — used behind the resume dialog
 *
 * Rules:
 *  - Meta entries apply silently and never cost a tap.
 *  - A `typing` entry runs its durationMs, then auto-resolves into the next
 *    renderable message — one beat, exactly like a real chat. In autoplay the
 *    dots honour the current speed.
 *  - Autoplay paces itself like a reader actually reading: delay scales with
 *    message length, so it mirrors the tap flow instead of racing it.
 *  - Reduced motion (`reduceMotion`) collapses waits to a beat.
 */
export function useRevealController(
  story,
  { reduceMotion = false, onReveal, startAt = 0, paused = false } = {}
) {
  const messages = useMemo(
    () => (Array.isArray(story?.messages) ? story.messages : []),
    [story]
  );

  const [cursor, setCursor] = useState(() =>
    Math.max(0, Math.min(Number(startAt) || 0, messages.length))
  );
  const [typing, setTyping] = useState(null);
  const [mode, setMode] = useState("tap");
  const [speed, setSpeed] = useState(1);
  // Two separate timers on purpose: the scheduling timer is cleared by effect
  // cleanups on every re-render, but a running typing bubble must survive
  // those cleanups or autoplay freezes on the dots.
  const timerRef = useRef(null); // schedules the NEXT beat (autoplay/first)
  const typingTimerRef = useRef(null); // resolves an in-flight typing bubble
  const typingResolveRef = useRef(null); // pending "finish typing" action
  const onRevealRef = useRef(onReveal);
  useEffect(() => {
    onRevealRef.current = onReveal;
  }, [onReveal]);
  // step() reads these through refs so typing durations react to live speed/mode
  const speedRef = useRef(speed);
  const modeRef = useRef(mode);
  useEffect(() => {
    speedRef.current = speed;
    modeRef.current = mode;
  }, [speed, mode]);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  const clearTypingTimer = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
  };

  const done = cursor >= messages.length && !typing;

  // Live conversation column + header state derive from the consumed prefix.
  const visible = useMemo(
    () => messages.slice(0, cursor).filter((m) => RENDERABLE_TYPES.has(m.type)),
    [messages, cursor]
  );
  const header = useMemo(() => {
    const h = {
      contactName: story?.contactName || "Unknown",
      contactAvatar: story?.contactAvatar || "",
      statusText: story?.statusText ?? "online",
    };
    for (const m of messages.slice(0, cursor)) {
      if (m.type === "contact") {
        if (m.contactName != null) h.contactName = m.contactName;
        if (m.contactAvatar != null) h.contactAvatar = m.contactAvatar;
      } else if (m.type === "presence") {
        h.statusText = m.text ?? "";
      }
    }
    if (typing) h.statusText = "typing…";
    return h;
  }, [messages, cursor, story, typing]);

  /** Consume one beat starting at `from`; returns the new cursor. */
  const step = useCallback(
    (from) => {
      let i = from;
      // metas are free — apply and keep walking
      while (i < messages.length && META_TYPES.has(messages[i].type)) i++;
      if (i >= messages.length) {
        setCursor(i);
        return i;
      }

      const entry = messages[i];
      if (entry.type === "typing") {
        // show dots, then resolve into the following message automatically
        let duration = Math.min(Math.max(Number(entry.durationMs) || 1800, 350), 8000);
        if (modeRef.current === "auto") duration = duration / speedRef.current;
        if (reduceMotion) duration = 350;
        setCursor(i + 1);
        setTyping(entry);
        const resolve = () => {
          typingResolveRef.current = null;
          setTyping(null);
          setCursor((c) => {
            let j = c;
            while (j < messages.length && META_TYPES.has(messages[j].type)) j++;
            if (j < messages.length) {
              onRevealRef.current?.(messages[j]);
              j++;
            }
            return j;
          });
        };
        typingResolveRef.current = resolve;
        clearTypingTimer();
        typingTimerRef.current = setTimeout(resolve, Math.max(duration, 250));
        return i + 1;
      }

      onRevealRef.current?.(entry);
      setCursor(i + 1);
      return i + 1;
    },
    [messages, reduceMotion]
  );

  const advance = useCallback(() => {
    if (paused) return;
    if (typingResolveRef.current) {
      // tapping through the dots fast-forwards them into the message
      clearTypingTimer();
      typingResolveRef.current();
      return;
    }
    if (cursor < messages.length) step(cursor);
  }, [paused, cursor, messages.length, step]);

  /** Instant rewind/fast-forward — used for resume; nothing animates. */
  const jumpTo = useCallback(
    (index) => {
      clearTimer();
      clearTypingTimer();
      typingResolveRef.current = null;
      setTyping(null);
      setCursor(Math.max(0, Math.min(Number(index) || 0, messages.length)));
    },
    [messages.length]
  );

  const restart = useCallback(() => jumpTo(0), [jumpTo]);

  // First beat reveals itself — an empty phone screen reads as broken.
  useEffect(() => {
    if (paused || cursor !== 0 || messages.length === 0 || typing) return;
    timerRef.current = setTimeout(() => step(0), reduceMotion ? 80 : 500);
    return clearTimer;
  }, [paused, cursor, messages, typing, step, reduceMotion]);

  // Autoplay: schedule the next beat once the current one has settled.
  // Paced like real reading (length-based) so it mirrors the tap flow;
  // `speed` scales the whole thing. (step() swallows a metas-only tail.)
  useEffect(() => {
    if (paused || mode !== "auto" || typing || done || cursor === 0) return;
    let i = cursor;
    while (i < messages.length && META_TYPES.has(messages[i].type)) i++;
    const next = i < messages.length ? messages[i] : null;
    let delay = !next
      ? 400
      : next.pauseMs != null
        ? Number(next.pauseMs)
        : next.type === "text"
          ? 900 + Math.min(String(next.text || "").length * 42, 3400)
          : next.type === "missed_call"
            ? 2000
            : 1600; // system / typing lead-in
    delay = delay / speed;
    if (reduceMotion) delay = Math.min(delay, 700);
    timerRef.current = setTimeout(() => step(cursor), delay);
    return clearTimer;
  }, [paused, mode, speed, typing, done, cursor, messages, step, reduceMotion]);

  // never leak timers on unmount / story change
  useEffect(
    () => () => {
      clearTimer();
      clearTypingTimer();
    },
    [story]
  );

  const progress = messages.length ? Math.min(cursor / messages.length, 1) : 0;

  return {
    visible, typing, header, cursor, progress, done,
    mode, setMode, speed, setSpeed, advance, jumpTo, restart,
  };
}

export default useRevealController;
