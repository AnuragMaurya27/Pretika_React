// Touch / no-hover devices (phones, tablets) have no real cursor. Detect once
// so pointer-driven flourishes — the 3D card tilt and the tap-scale press — can
// fall back to something that doesn't fight the finger. On touch, framer-motion's
// whileTap fires the moment you press a card to start scrolling: it scales the
// card down (over the slow entrance transition) and captures the pointer, so the
// card wobbles under your thumb and the scroll stutters. Skip it there.
export const IS_TOUCH =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(hover: none), (pointer: coarse)").matches;
