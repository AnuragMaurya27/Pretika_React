import { mediaUrl } from "./constants";

function esc(s = "") {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Convert a (subset of) Quill Delta into safe HTML. Handles the common ops
// produced by flutter_quill: text inserts, bold/italic/underline, headers,
// blockquote, and image inserts. Anything exotic degrades to plain text.
function deltaToHtml(ops) {
  let html = "";
  let line = "";
  const flush = (block = "p", attrs = {}) => {
    if (!line.trim() && block === "p") { html += "<br/>"; line = ""; return; }
    let tag = block;
    if (attrs.header) tag = `h${attrs.header}`;
    if (attrs.blockquote) tag = "blockquote";
    html += `<${tag}>${line}</${tag}>`;
    line = "";
  };
  for (const op of ops) {
    if (typeof op.insert === "object" && op.insert.image) {
      html += `<img src="${mediaUrl(op.insert.image)}" alt="" />`;
      continue;
    }
    const text = String(op.insert ?? "");
    const a = op.attributes || {};
    const parts = text.split("\n");
    parts.forEach((part, idx) => {
      let chunk = esc(part);
      if (a.bold) chunk = `<strong>${chunk}</strong>`;
      if (a.italic) chunk = `<em>${chunk}</em>`;
      if (a.underline) chunk = `<u>${chunk}</u>`;
      line += chunk;
      if (idx < parts.length - 1) flush("p", op.attributes || {});
    });
  }
  if (line) html += `<p>${line}</p>`;
  return html;
}

/**
 * Alternate group ↔ individual chat stories ("ek group, ek single") so any
 * list of Pretika Chats shows variety regardless of API order. Stable within
 * each type, leftovers appended in order.
 */
export function interleaveChatTypes(items = []) {
  const groups = items.filter((s) => s.chat_type === "group");
  const singles = items.filter((s) => s.chat_type !== "group");
  const out = [];
  for (let i = 0; i < Math.max(groups.length, singles.length); i++) {
    if (groups[i]) out.push(groups[i]);
    if (singles[i]) out.push(singles[i]);
  }
  return out;
}

/** Returns { html } ready for dangerouslySetInnerHTML, from any stored format. */
export function renderEpisode(content) {
  if (!content) return { html: "" };
  const trimmed = content.trim();

  // Quill delta?
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      const ops = Array.isArray(parsed) ? parsed : parsed.ops;
      if (Array.isArray(ops)) return { html: deltaToHtml(ops) };
    } catch { /* not delta */ }
  }

  // Already HTML?
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) return { html: trimmed };

  // Plain text → paragraphs
  const html = trimmed
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return { html };
}
