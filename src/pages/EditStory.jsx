import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ImagePlus, Loader2, Pencil, Feather, Layers, Save,
  Send, EyeOff, Trash2, Plus, ExternalLink, Check, X, PenSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { get, post, put, del, errMsg } from "../lib/api";
import { useCategories } from "../lib/hooks";
import { useAuth } from "../store/auth";
import Seo from "../components/Seo";
import Img from "../components/Img";
import ThumbnailStudio from "../components/ThumbnailStudio";
import { SkeletonBox } from "../components/Skeleton";

const STATUS_COLORS = {
  published: "badge-green", draft: "badge-gold", under_review: "badge-blue",
  scheduled: "badge-indigo", rejected: "badge-red", archived: "badge-red", removed: "badge-red",
};

/**
 * Edit an existing story (draft or published). Uses only the endpoints the API
 * already exposes — no API changes. `CreateStory` is left untouched so the
 * create flow can't regress.
 */
export default function EditStory() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { id } = useParams();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const cats = useCategories();

  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState(null);
  const [f, setF] = useState({ title: "", summary: "", category_id: "", language: "hindi", age_rating: "all", tags: "" });
  const [episodes, setEpisodes] = useState([]);
  const [newThumb, setNewThumb] = useState(null); // { path, preview } after a change
  const [studioOpen, setStudioOpen] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [busyStory, setBusyStory] = useState(false);

  // inline episode editor: openId is an episode id, "new", or null
  const [openId, setOpenId] = useState(null);
  const [epForm, setEpForm] = useState({ title: "", content: "" });
  const [epBusy, setEpBusy] = useState(false);
  const [epLoading, setEpLoading] = useState(false);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));

  const invalidate = useCallback(() => {
    ["my-stories", "stories", "story", "creator-stories", "creator-stats", "episode"]
      .forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  }, [qc]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await get(`/stories/id/${id}`);
      setStory(s);
      setF({
        title: s.title || "", summary: s.summary || "", category_id: s.category_id || "",
        language: s.language || "hindi", age_rating: s.age_rating || "all",
        tags: (s.tags || []).join(", "),
      });
      setEpisodes([...(s.episodes || [])].sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0)));
      setNewThumb(null);
    } catch (e) {
      toast.error(errMsg(e, t("editStory.loadFail", { defaultValue: "Could not load this story" })));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  /* ── cover: uploaded already by the studio; persist immediately ─────────── */
  const onThumbDone = async (th) => {
    setNewThumb(th);
    try {
      await put(`/stories/${id}`, { thumbnail_url: th.path });
      setStory((s) => ({ ...s, thumbnail_url: th.path }));
      invalidate();
      toast.success(t("editStory.coverUpdated", { defaultValue: "Cover updated" }));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  /* ── save story details ─────────────────────────────────────────────────── */
  const saveDetails = async () => {
    if (f.title.trim().length < 3)
      return toast.error(t("studio.errTitle", { defaultValue: "Title too short" }));
    setSavingDetails(true);
    try {
      await put(`/stories/${id}`, {
        title: f.title.trim(),
        summary: f.summary.trim(),
        category_id: f.category_id || undefined,
        language: f.language,
        age_rating: f.age_rating,
        tags: f.tags ? f.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
      invalidate();
      toast.success(t("editStory.saved", { defaultValue: "Changes saved" }));
      await load();
    } catch (e) {
      toast.error(errMsg(e, t("editStory.saveFail", { defaultValue: "Could not save changes" })));
    } finally {
      setSavingDetails(false);
    }
  };

  /* ── episodes ───────────────────────────────────────────────────────────── */
  const openEpisode = async (ep) => {
    if (openId === ep.id) { setOpenId(null); return; }
    setOpenId(ep.id);
    setEpForm({ title: ep.title || "", content: "" });
    setEpLoading(true);
    try {
      const full = await get(`/stories/${id}/episodes/${ep.id}`);
      setEpForm({ title: full.title || "", content: full.content || "" });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setEpLoading(false);
    }
  };

  const openNewEpisode = () => { setOpenId("new"); setEpForm({ title: "", content: "" }); };

  const saveEpisode = async () => {
    if (!epForm.content.trim())
      return toast.error(t("studio.errContent", { defaultValue: "Write the episode first" }));
    setEpBusy(true);
    try {
      if (openId === "new") {
        await post(`/stories/${id}/episodes`, {
          title: epForm.title.trim() || `${t("card.part", { defaultValue: "Episode" })} ${episodes.length + 1}`,
          content: epForm.content,
          access_type: "free",
        });
        toast.success(t("editStory.epAdded", { defaultValue: "Episode added" }));
      } else {
        await put(`/stories/${id}/episodes/${openId}`, {
          title: epForm.title.trim() || undefined,
          content: epForm.content,
        });
        toast.success(t("editStory.epSaved", { defaultValue: "Episode saved" }));
      }
      setOpenId(null);
      invalidate();
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setEpBusy(false);
    }
  };

  const publishEpisode = async (ep) => {
    try {
      await post(`/stories/${id}/episodes/${ep.id}/publish`);
      toast.success(t("editStory.epPublished", { defaultValue: "Episode published" }));
      invalidate();
      await load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  const deleteEpisode = async (ep) => {
    if (!window.confirm(t("editStory.confirmDelEp", { defaultValue: "Delete this episode? This cannot be undone." }))) return;
    try {
      await del(`/stories/${id}/episodes/${ep.id}`);
      toast.success(t("editStory.epDeleted", { defaultValue: "Episode deleted" }));
      if (openId === ep.id) setOpenId(null);
      invalidate();
      await load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  /* ── story-level actions ────────────────────────────────────────────────── */
  const togglePublish = async () => {
    setBusyStory(true);
    try {
      if (story.status === "published") {
        await post(`/stories/${id}/unpublish`);
        toast.success(t("editStory.unpublished", { defaultValue: "Story unpublished" }));
      } else {
        await post(`/stories/${id}/publish`);
        toast.success(t("editStory.published", { defaultValue: "Story published" }));
      }
      invalidate();
      await load();
    } catch (e) {
      toast.error(errMsg(e, t("editStory.needPubEp", { defaultValue: "Publish at least one episode first" })));
    } finally {
      setBusyStory(false);
    }
  };

  const deleteStory = async () => {
    if (!window.confirm(t("editStory.confirmDelStory", { defaultValue: "Delete this whole story and all its episodes? This cannot be undone." }))) return;
    setBusyStory(true);
    try {
      await del(`/stories/${id}`);
      invalidate();
      toast.success(t("editStory.storyDeleted", { defaultValue: "Story deleted" }));
      nav("/creator/stories");
    } catch (e) {
      toast.error(errMsg(e));
      setBusyStory(false);
    }
  };

  /* ── guards ─────────────────────────────────────────────────────────────── */
  if (!user?.is_creator) {
    return (
      <div className="app-shell"><div className="page-scroll" style={{ display: "grid", placeItems: "center", minHeight: "70dvh" }}>
        <div className="center container" style={{ maxWidth: 420 }}>
          <div style={{ display: "grid", placeItems: "center" }}><PenSquare size={46} color="var(--crimson)" /></div>
          <div className="display" style={{ fontSize: 22, fontWeight: 800, marginTop: 12 }}>{t("creator.becomeTitle")}</div>
          <p className="muted" style={{ marginTop: 8 }}>{t("creator.needCreator")}</p>
          <button className="btn btn-primary btn-block mt-24" onClick={() => nav("/become-creator")}>{t("creator.becomeTitle")}</button>
        </div>
      </div></div>
    );
  }

  const words = epForm.content.trim() ? epForm.content.trim().split(/\s+/).length : 0;
  const canSaveDetails = f.title.trim().length >= 3;

  return (
    <div className="app-shell cs-page">
      <Seo title={story ? `Edit · ${story.title}` : "Edit story"} robots="noindex, follow" />

      {/* header */}
      <header className="cs-head only-mobile">
        <button onClick={() => nav(-1)} aria-label="Back"><ArrowLeft size={22} /></button>
        <div className="section-title">{t("editStory.title", { defaultValue: "Edit story" })}</div>
        {story?.slug && (
          <button onClick={() => nav(`/story/${story.slug}`)} aria-label="View" style={{ marginLeft: "auto" }}><ExternalLink size={18} /></button>
        )}
      </header>

      <div className="container cs-wrap">
        <div className="only-desktop between" style={{ marginBottom: 20 }}>
          <div>
            <div className="eyebrow"><Feather size={13} /> {t("creator.dashboard")}</div>
            <h1 className="display" style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{t("editStory.title", { defaultValue: "Edit story" })}</h1>
          </div>
          {story?.slug && (
            <button className="btn btn-outline btn-sm" onClick={() => nav(`/story/${story.slug}`)}>
              <ExternalLink size={15} /> {t("creator.viewPublic", { defaultValue: "View" })}
            </button>
          )}
        </div>

        {loading || !story ? (
          <div style={{ display: "grid", gap: 14 }}>
            <SkeletonBox h={180} r={16} /><SkeletonBox h={220} r={16} /><SkeletonBox h={240} r={16} />
          </div>
        ) : (
          <>
            {/* status row */}
            <div className="row gap-8" style={{ marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span className={`badge ${STATUS_COLORS[story.status] || "badge-indigo"}`} style={{ textTransform: "capitalize" }}>
                {(story.status || "").replace(/_/g, " ")}
              </span>
              <span className="tertiary" style={{ fontSize: 12.5 }}>{episodes.length} {t("story.episodes", { defaultValue: "episodes" })}</span>
              <span style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-sm" disabled={busyStory} onClick={togglePublish}>
                {story.status === "published"
                  ? <><EyeOff size={15} /> {t("editStory.unpublish", { defaultValue: "Unpublish" })}</>
                  : <><Send size={15} /> {t("creator.publish", { defaultValue: "Publish" })}</>}
              </button>
            </div>

            {/* ═══ 1 · Cover ═══ */}
            <section className="cs-sec">
              <SecHead icon={<ImagePlus size={20} />} n={1} title={t("studio.coverTitle", { defaultValue: "Cover art" })} sub={t("studio.subtitle")} />
              <div className="cs-cover-row">
                <button onClick={() => setStudioOpen(true)} className="cs-thumb has" aria-label={t("studio.editThumb")}>
                  {newThumb
                    ? <img src={newThumb.preview} alt="" />
                    : <Img path={story.thumbnail_url} seed={story.id} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  <span className="cs-thumb-edit"><Pencil size={13} /> {t("studio.editThumb")}</span>
                </button>
                <div className="cs-cover-info">
                  <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
                    {t("studio.coverPitch", { defaultValue: "Upload a new poster — crop, zoom and add a title. Saved the moment you tap Use." })}
                  </p>
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => setStudioOpen(true)}>
                    <ImagePlus size={15} /> {t("studio.change", { defaultValue: "Change cover" })}
                  </button>
                </div>
              </div>
            </section>

            {/* ═══ 2 · Details ═══ */}
            <section className="cs-sec">
              <SecHead icon={<Feather size={20} />} n={2} title={t("studio.detailsTitle", { defaultValue: "Story details" })} sub={t("studio.detailsSub", { defaultValue: "Title, category and how readers find it" })} />

              <Field label={t("creator.title")} required hint={`${f.title.length}/255`}>
                <input className="input" value={f.title} onChange={set("title")} maxLength={255} />
              </Field>

              <Field label={t("creator.summary")} hint={`${f.summary.length}/1000`}>
                <textarea className="input" rows={3} value={f.summary} onChange={set("summary")} maxLength={1000} />
              </Field>

              <div className="cs-grid2">
                <Field label={t("creator.category")}>
                  <select className="input" value={f.category_id} onChange={set("category_id")}>
                    <option value="">{t("studio.pick", { defaultValue: "Choose…" })}</option>
                    {(cats.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label={t("creator.language")}>
                  <select className="input" value={f.language} onChange={set("language")}>
                    <option value="hindi">Hindi</option>
                    <option value="english">English</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </Field>
                <Field label={t("creator.ageRating")}>
                  <select className="input" value={f.age_rating} onChange={set("age_rating")}>
                    <option value="all">All</option><option value="13+">13+</option><option value="16+">16+</option><option value="18+">18+</option>
                  </select>
                </Field>
                <Field label={t("creator.storyType")}>
                  <input className="input" value={story.story_type === "series" ? t("creator.series") : t("creator.single")} disabled readOnly />
                </Field>
              </div>

              <Field label={t("creator.tags")}>
                <input className="input" value={f.tags} onChange={set("tags")} placeholder="bhoot, haveli, true story" />
              </Field>

              <button className="btn btn-primary" style={{ marginTop: 6 }} disabled={savingDetails || !canSaveDetails} onClick={saveDetails}>
                {savingDetails ? <Loader2 size={17} className="spin" /> : <><Save size={16} /> {t("editStory.saveDetails", { defaultValue: "Save details" })}</>}
              </button>
            </section>

            {/* ═══ 3 · Episodes ═══ */}
            <section className="cs-sec">
              <SecHead icon={<Layers size={20} />} n={3} title={t("creator.episodes", { defaultValue: "Episodes" })} sub={t("editStory.epSub", { defaultValue: "Edit, add, publish or remove episodes" })} />

              <div style={{ display: "grid", gap: 10 }}>
                {episodes.map((ep) => (
                  <div key={ep.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="row gap-10" style={{ padding: 12, alignItems: "center" }}>
                      <span className="tertiary" style={{ fontWeight: 800, fontSize: 13, minWidth: 22 }}>{ep.episode_number}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="clamp-1" style={{ fontWeight: 700, fontSize: 14 }}>{ep.title}</div>
                        <div className="row gap-8 tertiary" style={{ fontSize: 11.5, marginTop: 3 }}>
                          <span className={`badge ${STATUS_COLORS[ep.status] || "badge-gold"}`} style={{ textTransform: "capitalize" }}>{(ep.status || "").replace(/_/g, " ")}</span>
                          {ep.word_count ? <span>{ep.word_count} {t("studio.words", { defaultValue: "words" })}</span> : null}
                        </div>
                      </div>
                      {ep.status !== "published" && (
                        <button className="btn btn-ghost btn-sm" onClick={() => publishEpisode(ep)} title={t("creator.publish")}><Send size={14} /></button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => openEpisode(ep)}>
                        {openId === ep.id ? <X size={15} /> : <><Pencil size={14} /> {t("common.edit", { defaultValue: "Edit" })}</>}
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--error)" }} onClick={() => deleteEpisode(ep)} aria-label="Delete"><Trash2 size={15} /></button>
                    </div>

                    {openId === ep.id && (
                      <div style={{ padding: "0 12px 12px", borderTop: "1px solid var(--border-solid)" }}>
                        {epLoading ? (
                          <div className="center" style={{ padding: 24 }}><Loader2 size={20} className="spin tertiary" /></div>
                        ) : (
                          <EpisodeEditor
                            epForm={epForm} setEpForm={setEpForm} busy={epBusy}
                            words={words} onSave={saveEpisode} onCancel={() => setOpenId(null)} t={t}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {openId === "new" ? (
                <div className="card" style={{ padding: 12, marginTop: 10 }}>
                  <div className="row between" style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t("creator.addEpisode", { defaultValue: "New episode" })}</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setOpenId(null)}><X size={15} /></button>
                  </div>
                  <EpisodeEditor
                    epForm={epForm} setEpForm={setEpForm} busy={epBusy}
                    words={words} onSave={saveEpisode} onCancel={() => setOpenId(null)} t={t}
                  />
                </div>
              ) : (
                <button className="btn btn-outline btn-block" style={{ marginTop: 12 }} onClick={openNewEpisode}>
                  <Plus size={16} /> {t("creator.addEpisode", { defaultValue: "Add episode" })}
                </button>
              )}
            </section>

            {/* ═══ Danger zone ═══ */}
            <section className="cs-sec">
              <button className="btn btn-ghost btn-block" style={{ color: "var(--error)" }} disabled={busyStory} onClick={deleteStory}>
                <Trash2 size={16} /> {t("editStory.deleteStory", { defaultValue: "Delete this story" })}
              </button>
            </section>
          </>
        )}
      </div>

      <ThumbnailStudio
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        onDone={onThumbDone}
        suggestedText={f.title.trim()}
      />
    </div>
  );
}

function EpisodeEditor({ epForm, setEpForm, busy, words, onSave, onCancel, t }) {
  return (
    <>
      <Field label={t("creator.episodeTitle", { defaultValue: "Episode title" })}>
        <input className="input" value={epForm.title} onChange={(e) => setEpForm((s) => ({ ...s, title: e.target.value }))}
          placeholder={t("studio.epTitlePh", { defaultValue: "Episode title" })} />
      </Field>
      <div className="cs-write-wrap">
        <textarea className="input cs-write" value={epForm.content}
          onChange={(e) => setEpForm((s) => ({ ...s, content: e.target.value }))}
          placeholder={t("creator.episodeContent")} />
        <div className="cs-write-foot">
          <span style={{ flex: 1 }} />
          <span>{words} {t("studio.words", { defaultValue: "words" })}</span>
        </div>
      </div>
      <div className="row gap-10" style={{ marginTop: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>{t("common.cancel", { defaultValue: "Cancel" })}</button>
        <button className="btn btn-primary btn-sm" onClick={onSave} disabled={busy || !epForm.content.trim()}>
          {busy ? <Loader2 size={16} className="spin" /> : <><Check size={15} /> {t("editStory.saveEpisode", { defaultValue: "Save episode" })}</>}
        </button>
      </div>
    </>
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
