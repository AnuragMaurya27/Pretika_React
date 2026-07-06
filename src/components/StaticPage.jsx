import { Link } from "react-router-dom";
import Seo from "./Seo";

/* StaticPage — shared shell for the informational pages (About, Contact,
   Privacy, Terms). Pure token-based typography; no new global CSS. Every page
   ends with cross-links so these pages are reachable on mobile too (the
   desktop footer is hidden there). */
export default function StaticPage({ title, subtitle, path, description, updated, children }) {
  return (
    <div className="page">
      <Seo title={title} description={description} path={path} />
      <div className="page-scroll">
        <div className="container" style={{ maxWidth: 760, paddingTop: 36, paddingBottom: 60 }}>
          <header style={{ marginBottom: 28 }}>
            <h1 className="serif" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2 }}>{title}</h1>
            {subtitle && (
              <p className="muted" style={{ marginTop: 10, fontSize: 15, lineHeight: 1.7 }}>{subtitle}</p>
            )}
            {updated && (
              <p className="tertiary" style={{ marginTop: 8, fontSize: 12.5 }}>Last updated: {updated}</p>
            )}
          </header>

          <div style={{ display: "grid", gap: 26 }}>{children}</div>

          <nav aria-label="Site pages" style={{ marginTop: 44, paddingTop: 18, borderTop: "1px solid var(--border-solid)" }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Pretika</div>
            <div className="row" style={{ gap: 14, flexWrap: "wrap", fontSize: 13.5, fontWeight: 600 }}>
              <Link to="/home">Home</Link>
              <Link to="/explore">Stories</Link>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Use</Link>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section>
      {title && (
        <h2 className="serif" style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{title}</h2>
      )}
      <div className="muted" style={{ fontSize: 14.5, lineHeight: 1.85, display: "grid", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

export function Ul({ items }) {
  return (
    <ul style={{ paddingLeft: 20, display: "grid", gap: 7, listStyle: "disc" }}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}
