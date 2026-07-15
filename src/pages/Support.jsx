import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LifeBuoy, Plus, MessageSquare, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useSupportCategories, useMyTickets, useCreateTicket } from "../lib/hooks";
import { errMsg } from "../lib/api";
import { timeAgo } from "../lib/format";
import EmptyState from "../components/EmptyState";
import { SkeletonBox } from "../components/Skeleton";
import Seo from "../components/Seo";

const STATUS_BADGE = {
  open: "badge-blue",
  in_progress: "badge-gold",
  waiting_user: "badge-gold",
  resolved: "badge-green",
  closed: "badge-red",
};

const FILTERS = ["", "open", "in_progress", "resolved", "closed"];

/** Reader & creator help-desk — list my tickets + create a new one. */
export default function Support() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useMyTickets(filter);
  const items = data?.items || [];

  return (
    <div className="app-shell" style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <Seo title={t("support.title")} robots="noindex, follow" />

      <header className="container between" style={{ height: 56 }}>
        <div className="row gap-12 only-mobile">
          <button onClick={() => nav(-1)} aria-label={t("common.back")}><ArrowLeft size={22} /></button>
          <div className="section-title">{t("support.title")}</div>
        </div>
        <div className="only-desktop section-title">{t("support.title")}</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X size={15} /> : <Plus size={15} />} {t("support.newTicket")}
        </button>
      </header>

      <div className="container" style={{ paddingTop: 4, paddingBottom: 48, maxWidth: 860 }}>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>{t("support.sub")}</p>

        {/* create-ticket form (collapsible, in-flow so no portal needed) */}
        <AnimatePresence initial={false}>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "hidden" }}
            >
              <CreateTicketForm onDone={() => setShowForm(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* status filter chips */}
        <div className="row" style={{ gap: 8, flexWrap: "wrap", margin: "6px 0 16px" }}>
          {FILTERS.map((f) => {
            const on = filter === f;
            return (
              <button
                key={f || "all"}
                onClick={() => setFilter(f)}
                className="badge"
                style={{
                  padding: "7px 14px", fontSize: 12.5, cursor: "pointer",
                  background: on ? "var(--indigo-600)" : "var(--bg-card)",
                  color: on ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${on ? "var(--indigo-600)" : "var(--border-dark)"}`,
                }}
              >
                {f ? t(`support.status.${f}`) : t("support.statusAll")}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div style={{ display: "grid", gap: 12 }}>
            {[0, 1, 2].map((i) => <SkeletonBox key={i} h={76} r={14} />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<LifeBuoy size={32} />}
            title={t("support.empty")}
            sub={t("support.emptySub")}
          />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((tk) => (
              <Link
                key={tk.id}
                to={`/support/${tk.id}`}
                className="card row between"
                style={{ padding: "14px 16px", gap: 12 }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="row gap-8" style={{ flexWrap: "wrap" }}>
                    <span className="clamp-1" style={{ fontWeight: 700, fontSize: 14.5 }}>{tk.subject}</span>
                    <span className={`badge ${STATUS_BADGE[tk.status] || "badge-indigo"}`}>
                      {t(`support.status.${tk.status}`, { defaultValue: tk.status?.replace(/_/g, " ") })}
                    </span>
                  </div>
                  <div className="muted row gap-8" style={{ fontSize: 12, marginTop: 5, flexWrap: "wrap" }}>
                    <span>#{tk.ticket_number}</span>
                    {tk.category_name && <span>· {tk.category_name}</span>}
                    <span className="row" style={{ gap: 4 }}><MessageSquare size={12} /> {tk.message_count || 0}</span>
                    <span>· {timeAgo(tk.updated_at || tk.created_at)}</span>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateTicketForm({ onDone }) {
  const { t } = useTranslation();
  const cats = useSupportCategories();
  const create = useCreateTicket();
  const [categoryId, setCategoryId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const valid = subject.trim().length >= 5 && description.trim().length >= 20;

  const submit = (e) => {
    e.preventDefault();
    if (!valid || create.isPending) return;
    create.mutate(
      { category_id: categoryId || null, subject: subject.trim(), description: description.trim() },
      {
        onSuccess: () => { toast.success(t("support.created")); onDone?.(); },
        onError: (err) => toast.error(errMsg(err)),
      }
    );
  };

  return (
    <form className="card" style={{ padding: 18, marginBottom: 18 }} onSubmit={submit}>
      <div className="field">
        <label className="field-label">{t("support.category")}</label>
        <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">{t("support.selectCategory")}</option>
          {(cats.data || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="field-label">{t("support.subject")}</label>
        <input
          className="input"
          value={subject}
          maxLength={255}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("support.subjectPh")}
        />
      </div>
      <div className="field">
        <label className="field-label">{t("support.description")}</label>
        <textarea
          className="input"
          style={{ height: 120, paddingTop: 12, resize: "vertical" }}
          value={description}
          maxLength={5000}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("support.descriptionPh")}
        />
      </div>
      <button className="btn btn-primary" disabled={!valid || create.isPending}>
        {create.isPending ? "…" : t("support.create")}
      </button>
    </form>
  );
}
