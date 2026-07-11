import { useLang } from "../store/lang";

/**
 * EN | हिं segmented toggle — the always-available language switcher.
 * `dark` renders it for the charcoal navbars; default is the parchment UI.
 * Selecting also syncs the account's preferred_language when logged in.
 */
export default function LangToggle({ dark = false, style }) {
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.setLang);
  const isHi = lang === "hindi";

  const wrap = {
    display: "inline-flex", alignItems: "center", padding: 3, borderRadius: 999,
    background: dark ? "rgba(255,255,255,.12)" : "var(--bg-tertiary)",
    border: dark ? "1px solid rgba(255,255,255,.16)" : "1px solid var(--border-solid)",
    ...style,
  };
  const seg = (active) => ({
    minWidth: 40, height: 26, padding: "0 10px", borderRadius: 999,
    fontSize: 12, fontWeight: 700, lineHeight: "26px", textAlign: "center",
    transition: "background .15s, color .15s",
    background: active ? (dark ? "#fff" : "var(--indigo-600)") : "transparent",
    color: active
      ? (dark ? "var(--indigo-900)" : "#fff")
      : (dark ? "rgba(255,255,255,.75)" : "var(--text-secondary)"),
  });

  return (
    <span style={wrap} role="group" aria-label="Language / भाषा">
      <button style={seg(!isHi)} onClick={() => setLang("english")} aria-pressed={!isHi}>EN</button>
      <button style={seg(isHi)} onClick={() => setLang("hindi")} aria-pressed={isHi} lang="hi">हिं</button>
    </span>
  );
}
