import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

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

  // glare follows the cursor
  const glareX = useTransform(px, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(py, [0, 1], ["0%", "100%"]);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });

  if (reduce) {
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
            background: useTransform(
              [glareX, glareY],
              ([x, y]) =>
                `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,.85), rgba(255,255,255,0) 55%)`
            ),
          }}
        />
      )}
    </motion.div>
  );
}
