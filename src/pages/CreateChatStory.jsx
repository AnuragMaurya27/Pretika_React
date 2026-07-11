import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ChevronDown, ChevronUp, Copy, Braces, Loader2, Lock,
  MessageSquareText, PhoneMissed, Play, Plus, Save, Send, Smartphone,
  Trash2, UserRound, Info, MoreHorizontal, Megaphone, Ghost,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { errMsg } from "../lib/api";
import { useAuth } from "../store/auth";
import { useChatStoryById, useSaveChatStory } from "../lib/hooks";
import Seo from "../components/Seo";
import ChatStoryReader from "../components/chatstory/ChatStoryReader";

/**
 * Chat-story builder — official Pretika account only (server re-checks).
 * Visual message editor + raw JSON mode + a live full-phone preview that runs
 * the exact reader readers get. The preview is portalled to <body> because
 * Layout's page-transition filter traps position:fixed elements.
 */

const TYPES = [
  { type: "text", label: "Message", icon: MessageSquareText },
  { type: "typing", label: "Typing…", icon: MoreHorizontal },
  { type: "system", label: "System line", icon: Info },
  { type: "missed_call", label: "Missed call", icon: PhoneMissed },
  { type: "presence", label: "Presence", icon: Megaphone },
  { type: "contact", label: "Contact badle", icon: UserRound },
];

let uidSeq = 1;
const uid = () => `m${Date.now().toString(36)}${uidSeq++}`;

function blankEntry(type) {
  const base = { _uid: uid(), type };
  if (type === "text") return { ...base, sender: "them", text: "", time: "" };
  if (type === "typing") return { ...base, sender: "them", durationMs: 2500 };
  if (type === "system") return { ...base, text: "" };
  if (type === "missed_call") return { ...base, sender: "me", callerName: "", count: 1, time: "" };
  if (type === "presence") return { ...base, text: "online" };
  return { ...base, contactName: "", contactAvatar: "" };
}

/** strip editor-only fields + assign stable ids for the stored script */
function toScript(entries) {
  return entries.map((e, i) => {
    // eslint-disable-next-line no-unused-vars
    const { _uid, ...rest } = e;
    const out = { id: i + 1, ...rest };
    if (out.type === "text" && !out.status && out.sender === "me") out.status = "seen";
    if (out.type === "typing") out.durationMs = Number(out.durationMs) || 2000;
    if (out.type === "missed_call") out.count = Number(out.count) || 1;
    return out;
  });
}

export default function CreateChatStory() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { id: editId } = useParams();
  const user = useAuth((s) => s.user);
  const isOfficial = user?.username?.toLowerCase() === "pretika";

  const existing = useChatStoryById(isOfficial ? editId : null);
  const save = useSaveChatStory();

  const [f, setF] = useState({
    title: "", description: "", contact_name: "", contact_avatar: "",
    chat_type: "individual", language: "hinglish", duration_minutes: 10,
  });
  const [entries, setEntries] = useState([blankEntry("text")]);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [preview, setPreview] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e?.target ? e.target.value : e }));

  // hydrate the form when editing (render-time state adjustment, no effect)
  const [loadedId, setLoadedId] = useState(null);
  const d = editId ? existing.data : null;
  if (d && loadedId !== d.id) {
    setLoadedId(d.id);
    setF({
      title: d.title || "",
      description: d.description || "",
      contact_name: d.contact_name || "",
      contact_avatar: d.contact_avatar || "",
      chat_type: d.chat_type || "individual",
      language: d.language || "hinglish",
      duration_minutes: d.duration_minutes || 10,
    });
    if (Array.isArray(d.messages))
      setEntries(d.messages.map((m) => ({ _uid: uid(), ...m })));
  }

  const previewStory = useMemo(
    () => ({
      id: "preview",
      title: f.title || "Preview",
      contactName: f.contact_name || "Unknown",
      contactAvatar: f.contact_avatar,
      chatType: f.chat_type,
      statusText: "online",
      messages: toScript(entries),
    }),
    [f, entries]
  );

  if (!isOfficial) {
    return (
      <div className="app-shell">
        <Seo title="Chat Story Studio" robots="noindex, follow" />
        <div className="page-scroll" style={{ display: "grid", placeItems: "center", minHeight: "70dvh" }}>
          <div className="center container" style={{ maxWidth: 420 }}>
            <div style={{ display: "grid", placeItems: "center" }}><Lock size={44} color="var(--crimson)" /></div>
            <div className="display" style={{ fontSize: 22, fontWeight: 800, marginTop: 12 }}>
              {t("chats.studioTitle")}
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              {t("chats.studioLocked")}
            </p>
            <button className="btn btn-primary btn-block mt-24" onClick={() => nav("/creator/story/new")}>
              {t("chats.writeStory")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const update = (i, patch) =>
    setEntries((list) => list.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const move = (i, dir) =>
    setEntries((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (i) => setEntries((list) => list.filter((_, idx) => idx !== i));
  const duplicate = (i) =>
    setEntries((list) => {
      const next = [...list];
      next.splice(i + 1, 0, { ...list[i], _uid: uid() });
      return next;
    });
  const add = (type) => setEntries((list) => [...list, blankEntry(type)]);

  const openJson = () => {
    setJsonText(JSON.stringify(toScript(entries), null, 2));
    setJsonMode(true);
  };
  const applyJson = () => {
    try {
      const arr = JSON.parse(jsonText);
      if (!Array.isArray(arr)) throw new Error("JSON array chahiye");
      setEntries(arr.map((m) => ({ _uid: uid(), ...m })));
      setJsonMode(false);
      toast.success("Script import ho gayi");
    } catch (e) {
      toast.error(`Invalid JSON: ${e.message}`);
    }
  };

  const canSubmit = f.title.trim().length >= 3 && f.contact_name.trim() && entries.length > 0;

  const submit = (status) => {
    if (!canSubmit) return toast.error(t("chats.needFields"));
    save.mutate(
      {
        id: editId,
        title: f.title.trim(),
        description: f.description.trim() || undefined,
        contact_name: f.contact_name.trim(),
        contact_avatar: f.contact_avatar.trim() || undefined,
        chat_type: f.chat_type,
        language: f.language,
        duration_minutes: Number(f.duration_minutes) || 10,
        messages: toScript(entries),
        status,
      },
      {
        onSuccess: () => {
          toast.success(status === "published" ? t("chats.liveNow") : t("chats.draftSaved"));
          nav("/chat-stories");
        },
        onError: (e) => toast.error(errMsg(e, t("chats.saveFailed"))),
      }
    );
  };

  return (
    <div className="app-shell cs-page">
      <Seo title={editId ? "Edit Chat Story" : "New Chat Story"} robots="noindex, follow" />

      <header className="cs-head only-mobile">
        <button onClick={() => nav("/chat-stories")} aria-label={t("common.back")}><ArrowLeft size={22} /></button>
        <div className="section-title">Chat Story Studio</div>
      </header>

      <div className="container cs-wrap">
        <div className="only-desktop" style={{ marginBottom: 20 }}>
          <div className="eyebrow"><Ghost size={13} /> Pretika Originals</div>
          <h1 className="display" style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>
            {editId ? "Chat story edit karo" : "Nai chat story"}
          </h1>
        </div>

        {/* ═══ 1 · Chat setup ═══ */}
        <section className="cs-sec">
          <SecHead icon={<Smartphone size={20} />} n={1} title="Chat setup"
            sub="Phone pe yeh chat kiski dikhegi" />

          <Field label="Story title" required hint={`${f.title.length}/255`}>
            <input className="input" value={f.title} onChange={set("title")} maxLength={255}
              placeholder="e.g. Maa — 11:42 PM" />
          </Field>
          <Field label="Description (browse page ke liye)">
            <textarea className="input" rows={2} value={f.description} onChange={set("description")}
              placeholder="Ek line jo reader ko kheench le…" />
          </Field>
          <div className="cs-grid2">
            <Field label="Contact name" required>
              <input className="input" value={f.contact_name} onChange={set("contact_name")}
                maxLength={120} placeholder="Maa / Unknown Number / Hostel Group" />
            </Field>
            <Field label="Contact avatar URL">
              <input className="input" value={f.contact_avatar} onChange={set("contact_avatar")}
                placeholder="https://… (khaali = auto avatar)" />
            </Field>
            <Field label="Chat type">
              <select className="input" value={f.chat_type} onChange={set("chat_type")}>
                <option value="individual">1:1 chat</option>
                <option value="group">Group chat</option>
              </select>
            </Field>
            <Field label="Language">
              <select className="input" value={f.language} onChange={set("language")}>
                <option value="hindi">Hindi</option>
                <option value="english">English</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </Field>
            <Field label="Duration (minutes)">
              <input className="input" type="number" min={1} max={120}
                value={f.duration_minutes} onChange={set("duration_minutes")} />
            </Field>
          </div>
        </section>

        {/* ═══ 2 · Script ═══ */}
        <section className="cs-sec">
          <div className="between" style={{ marginBottom: 4 }}>
            <SecHead icon={<MessageSquareText size={20} />} n={2} title="Script"
              sub={`${entries.length} beats — message, typing, system, missed call`} />
            <button className="btn btn-ghost btn-sm" onClick={jsonMode ? applyJson : openJson}>
              <Braces size={14} /> {jsonMode ? "Apply JSON" : "JSON"}
            </button>
          </div>

          {jsonMode ? (
            <div className="cs-write-wrap">
              <textarea className="input cs-write" style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}
                value={jsonText} onChange={(e) => setJsonText(e.target.value)} spellCheck={false} />
              <div className="cs-write-foot">
                Schema: src/components/chatstory/chatStorySchema.js
                <span style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-sm" onClick={() => setJsonMode(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gap: 10 }}>
                {entries.map((e, i) => (
                  <EntryCard key={e._uid} entry={e} i={i} total={entries.length}
                    group={f.chat_type === "group"}
                    onChange={(patch) => update(i, patch)}
                    onMove={(dir) => move(i, dir)}
                    onRemove={() => remove(i)}
                    onDuplicate={() => duplicate(i)} />
                ))}
              </div>
              <div className="row gap-8 mt-16" style={{ flexWrap: "wrap" }}>
                {TYPES.map(({ type, label, icon: Icon }) => (
                  <button key={type} className="chip" onClick={() => add(type)}>
                    <Plus size={13} /> <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ═══ Sticky action bar ═══ */}
      <div className="cs-footer">
        <div className="container cs-footer-in">
          <div className="only-desktop cs-footer-hint">
            {canSubmit
              ? <span className="tertiary">Pehle preview me khud darr ke dekho, phir publish karo</span>
              : <span className="tertiary">Title, contact aur script add karo</span>}
          </div>
          <div className="cs-footer-btns">
            <button className="btn btn-ghost" disabled={!entries.length} onClick={() => setPreview(true)}>
              <Play size={17} /> Preview
            </button>
            <button className="btn btn-ghost" disabled={save.isPending || !canSubmit} onClick={() => submit("draft")}>
              {save.isPending ? <Loader2 size={18} className="spin" /> : <><Save size={17} /> Draft</>}
            </button>
            <button className="btn btn-primary" disabled={save.isPending || !canSubmit} onClick={() => submit("published")}>
              {save.isPending ? <Loader2 size={18} className="spin" /> : <><Send size={17} /> Publish</>}
            </button>
          </div>
        </div>
      </div>

      {/* live phone preview — portalled past Layout's transition filter */}
      {preview &&
        createPortal(
          <ChatStoryReader story={previewStory} onExit={() => setPreview(false)} />,
          document.body
        )}
    </div>
  );
}

/* ─── script entry editor ─────────────────────────────────────────────────── */

function EntryCard({ entry, i, total, group, onChange, onMove, onRemove, onDuplicate }) {
  const meta = TYPES.find((t) => t.type === entry.type) || TYPES[0];
  const Icon = meta.icon;
  const senderPick = (v) => onChange({ sender: v });

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="between" style={{ marginBottom: 8 }}>
        <span className="row gap-6" style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-secondary)" }}>
          <span className="badge badge-indigo"><Icon size={12} /> {meta.label}</span>
          <span className="tertiary">#{i + 1}</span>
        </span>
        <span className="row gap-4">
          <IconBtn label="Upar" disabled={i === 0} onClick={() => onMove(-1)}><ChevronUp size={15} /></IconBtn>
          <IconBtn label="Neeche" disabled={i === total - 1} onClick={() => onMove(1)}><ChevronDown size={15} /></IconBtn>
          <IconBtn label="Copy" onClick={onDuplicate}><Copy size={14} /></IconBtn>
          <IconBtn label="Delete" danger onClick={onRemove}><Trash2 size={14} /></IconBtn>
        </span>
      </div>

      {(entry.type === "text" || entry.type === "typing") && (
        <div className="row gap-6 mb-8" style={{ flexWrap: "wrap" }}>
          <button className={`chip ${entry.sender === "them" ? "active" : ""}`} onClick={() => senderPick("them")}>
            Unka message
          </button>
          {entry.type === "text" && (
            <button className={`chip ${entry.sender === "me" ? "active" : ""}`} onClick={() => senderPick("me")}>
              Mera (reader)
            </button>
          )}
          {group && (
            <input className="input" style={{ height: 36, maxWidth: 170, fontSize: 13 }}
              value={entry.sender === "them" || entry.sender === "me" ? "" : entry.sender || ""}
              onChange={(e) => senderPick(e.target.value || "them")}
              placeholder="ya member ka naam" />
          )}
        </div>
      )}

      {entry.type === "text" && (
        <>
          <textarea className="input" rows={2} value={entry.text || ""}
            onChange={(e) => onChange({ text: e.target.value })} placeholder="Message likho…" />
          <div className="row gap-8 mt-8" style={{ flexWrap: "wrap" }}>
            <input className="input" style={{ height: 38, maxWidth: 140, fontSize: 13 }}
              value={entry.time || ""} onChange={(e) => onChange({ time: e.target.value })}
              placeholder="11:42 PM" />
            {entry.sender === "me" && (
              <select className="input" style={{ height: 38, maxWidth: 190, fontSize: 13 }}
                value={entry.status || "seen"} onChange={(e) => onChange({ status: e.target.value })}>
                <option value="sent">✓ sent</option>
                <option value="delivered">✓✓ delivered</option>
                <option value="seen">✓✓ seen (blue)</option>
                <option value="seen_wrong">✓✓ seen — CRIMSON (ek baar!)</option>
              </select>
            )}
          </div>
        </>
      )}

      {entry.type === "typing" && (
        <label className="row gap-8" style={{ fontSize: 13 }}>
          Dots kitni der?
          <input className="input" type="number" min={400} max={8000} step={100}
            style={{ height: 38, maxWidth: 120 }}
            value={entry.durationMs || 2000}
            onChange={(e) => onChange({ durationMs: Number(e.target.value) })} />
          ms — lambi chuppi = zyada darr
        </label>
      )}

      {entry.type === "system" && (
        <input className="input" value={entry.text || ""}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder='"Maa left the chat" / "Aaj 11:40 PM"' />
      )}

      {entry.type === "missed_call" && (
        <div className="row gap-8" style={{ flexWrap: "wrap" }}>
          <input className="input" style={{ height: 38, flex: 1, minWidth: 130 }}
            value={entry.callerName || ""} onChange={(e) => onChange({ callerName: e.target.value })}
            placeholder="Kisne call kiya" />
          <input className="input" type="number" min={1} max={99} style={{ height: 38, width: 84 }}
            value={entry.count || 1} onChange={(e) => onChange({ count: Number(e.target.value) })} />
          <input className="input" style={{ height: 38, width: 120 }}
            value={entry.time || ""} onChange={(e) => onChange({ time: e.target.value })}
            placeholder="3:14 AM" />
        </div>
      )}

      {entry.type === "presence" && (
        <input className="input" value={entry.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder='header line: "online" / "last seen 3:14 AM" / khaali = hide' />
      )}

      {entry.type === "contact" && (
        <div className="row gap-8" style={{ flexWrap: "wrap" }}>
          <input className="input" style={{ height: 38, flex: 1, minWidth: 140 }}
            value={entry.contactName || ""} onChange={(e) => onChange({ contactName: e.target.value })}
            placeholder="Naya naam (chupchaap badlega)" />
          <input className="input" style={{ height: 38, flex: 1, minWidth: 140 }}
            value={entry.contactAvatar || ""} onChange={(e) => onChange({ contactAvatar: e.target.value })}
            placeholder="Naya avatar URL" />
        </div>
      )}
    </div>
  );
}

function IconBtn({ label, danger, disabled, onClick, children }) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 8,
        color: danger ? "var(--crimson)" : "var(--text-secondary)",
        background: "var(--bg-secondary)", opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SecHead({ icon, n, title, sub }) {
  return (
    <div className="cs-sec-head">
      <span className="cs-sec-ico">{icon}<span className="cs-sec-n">{n}</span></span>
      <div style={{ minWidth: 0 }}>
        <div className="cs-sec-title">{title}</div>
        {sub && <div className="cs-sec-sub">{sub}</div>}
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="cs-field">
      <div className="cs-field-top">
        <label className="field-label" style={{ margin: 0 }}>
          {label}{required && <span className="cs-req"> *</span>}
        </label>
        {hint && <span className="cs-field-hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
