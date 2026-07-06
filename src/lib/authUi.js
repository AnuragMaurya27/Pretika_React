/* Shared motion + link tokens for the auth pages. Kept out of Login.jsx so
   react-refresh sees component-only exports there. */
export const EASE = [0.16, 1, 0.3, 1];

/* entrance variant — parent staggers children that carry this */
export const riseVar = {
  hide: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export const linkStyle = { color: "var(--indigo-600)", fontSize: 13, fontWeight: 700 };
