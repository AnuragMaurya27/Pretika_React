import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { IS_TOUCH } from "../lib/device";

// On touch / no-hover devices the 3D cursor-tilt has nothing sane to follow:
// dragging a card feeds synthetic mouse coords into rotateX/rotateY and the card
// wobbles under your finger. There we fall back to a plain wrapper (below) — the
// tilt is a desktop-only treat. IS_TOUCH is shared with the cards' tap-scale.

/**
 * Tilt — buttery 3D tilt that follows the cursor (desktop) with a moving glare.
 * Spring-smoothed so it feels physical, not snappy. On touch / reduced-motion
 * it degrades to a plain wrapper so nothing janks on phones.
 *
 *   <Tilt max={12} className="poster"> …card… </Tilt>
 */
export default function Tilt({
  children,
  max = 12,          // max rotation in degrees
  scale = 1.04,      // hover zoom
  glare = true,
  className,
  style,
}) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(0.5); // 0..1 pointer position
  const py = useMotionValue(0.5);

  const spring = { stiffness: 260, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring);

  // glare follows the cursor. Every hook stays above the early return below so
  // the hook order never changes between renders (rules-of-hooks).
  const glareX = useTransform(px, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(py, [0, 1], ["0%", "100%"]);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,.85), rgba(255,255,255,0) 55%)`
  );

  // Plain wrapper on phones (touch) and for reduced-motion users.
  if (reduce || IS_TOUCH) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onEnter = () => glareOpacity.set(0.55);
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    glareOpacity.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      whileHover={{ scale }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{
        ...style,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 900,
        willChange: "transform",
      }}
      className={className}
    >
      {children}
      {glare && (
        <motion.span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            mixBlendMode: "overlay",
            opacity: glareOpacity,
            background: glareBg,
          }}
        />
      )}
    </motion.div>
  );
}
