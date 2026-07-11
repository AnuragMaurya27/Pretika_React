import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ImagePlus, Loader2, PenSquare, Pencil, BookOpen,
  Feather, Layers, Send, Save, Sparkles, Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { post, put, errMsg } from "../lib/api";
import { useCategories } from "../lib/hooks";
import { useAuth } from "../store/auth";
import Seo from "../components/Seo";
import ThumbnailStudio from "../components/ThumbnailStudio";
import { useLang } from "../store/lang";
import { categoryLabel } from "../lib/categories";

export default function CreateStory() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const lang = useLang((s) => s.lang);
  const cats = useCategories();

  const [f, setF] = useState({
    title: "", summary: "", category_id: "", story_type: "single",
    language: lang, age_rating: "all", tags: "",
    ep_title: "", ep_content: "",
  });
  const [thumb, setThumb] = useState(null); // { path, preview } from ThumbnailStudio
  const [studioOpen, setStudioOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e });

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

  const words = f.ep_content.trim() ? f.ep_content.trim().split(/\s+/).length : 0;
  const readMins = Math.max(1, Math.round(words / 200));
  const canSubmit = f.title.trim().length >= 3 && !!f.ep_content.trim();

  const submit = async (publish) => {
    if (f.title.trim().length < 3) return toast.error(t("studio.errTitle", { defaultValue: "Title too short" }));
    if (!f.ep_content.trim()) return toast.error(t("studio.errContent", { defaultValue: "Write your story" }));
    setBusy(true);
    try {
      const story = await post("/stories", {
        title: f.title.trim(),
        summary: f.summary.trim() || undefined,
        category_id: f.category_id || undefined,
        story_type: f.story_type,
        language: f.language,
        age_rating: f.age_rating,
        tags: f.tags ? f.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
      if (thumb?.path) {
        await put(`/stories/${story.id}`, { thumbnail_url: thumb.path }).catch(() => {});
      }
      // everything on Pretika is free to read
      const ep = await post(`/stories/${story.id}/episodes`, {
        title: f.ep_title.trim() || f.title.trim(),
        content: f.ep_content,
        access_type: "free",
      });
      if (publish) {
        await post(`/stories/${story.id}/episodes/${ep.id}/publish`).catch(() => {});
        await post(`/stories/${story.id}/publish`).catch(() => {});
      }
      toast.success(publish ? t("creator.published") : t("creator.storyCreated"));
      nav(`/story/${story.slug}`);
    } catch (e) {
      toast.error(errMsg(e, t("creator.couldNotCreate")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell cs-page">
      <Seo title="Write a Story" robots="noindex, follow" />

      {/* Mobile header */}
      <header className="cs-head only-mobile">
        <button onClick={() => nav(-1)} aria-label={t("common.back")}><ArrowLeft size={22} /></button>
        <div className="section-title">{t("creator.createStory")}</div>
      </header>

      <div className="container cs-wrap">
        {/* Desktop title */}
        <div className="only-desktop" style={{ marginBottom: 20 }}>
          <div className="eyebrow"><Feather size={13} /> {t("creator.dashboard")}</div>
          <h1 className="display" style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{t("creator.createStory")}</h1>
        </div>

        {/* ═══ 1 · Cover art ═══ */}
        <section className="cs-sec">
          <SecHead icon={<ImagePlus size={20} />} n={1} title={t("studio.coverTitle", { defaultValue: "Cover art" })} sub={t("studio.subtitle")} />
          <div className="cs-cover-row">
            <button
              onClick={() => setStudioOpen(true)}
              className={`cs-thumb ${thumb ? "has" : ""}`}
              aria-label={thumb ? t("studio.editThumb") : t("studio.addThumb")}
            >
              {thumb ? (
                <>
                  <img src={thumb.preview} alt="" />
                  <span className="cs-thumb-edit"><Pencil size={13} /> {t("studio.editThumb")}</span>
                </>
              ) : (
                <span className="cs-thumb-empty">
                  <span className="cs-thumb-ico"><ImagePlus size={24} /></span>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>{t("studio.addThumb")}</span>
                </span>
              )}
            </button>
            <div className="cs-cover-info">
              <div className="row gap-8" style={{ marginBottom: 8 }}>
                {thumb
                  ? <span className="badge badge-green"><Check size={12} /> {t("studio.uploaded")}</span>
                  : <span className="badge badge-gold"><Sparkles size={12} /> {t("studio.recommended", { defaultValue: "Recommended" })}</span>}
              </div>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
                {t("studio.coverPitch", { defaultValue: "A striking poster gets more reads. Crop, zoom and add a title — you'll see exactly how it looks on Home." })}
              </p>
              <div className="cs-cover-feats">
                <span><BookOpen size={13} /> {t("studio.ratioNote")}</span>
                <span><Pencil size={13} /> {t("studio.addText")}</span>
              </div>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => setStudioOpen(true)}>
                <ImagePlus size={15} /> {thumb ? t("studio.editThumb") : t("studio.addThumb")}
              </button>
            </div>
          </div>
        </section>

        {/* ═══ 2 · Story details ═══ */}
        <section className="cs-sec">
          <SecHead icon={<Feather size={20} />} n={2} title={t("studio.detailsTitle", { defaultValue: "Story details" })} sub={t("studio.detailsSub", { defaultValue: "Title, category and how readers find it" })} />

          <Field label={t("creator.title")} required hint={`${f.title.length}/255`}>
            <input className="input" value={f.title} onChange={set("title")} maxLength={255}
              placeholder={t("studio.titlePh", { defaultValue: "e.g. पुरानी हवेली का राज़" })} />
          </Field>

          <Field label={t("creator.summary")} hint={`${f.summary.length}/1000`}>
            <textarea className="input" rows={3} value={f.summary} onChange={set("summary")} maxLength={1000}
              placeholder={t("studio.summaryPh", { defaultValue: "One or two lines that hook the reader…" })} />
          </Field>

          <div className="cs-grid2">
            <Field label={t("creator.category")}>
              <select className="input" value={f.category_id} onChange={set("category_id")}>
                <option value="">{t("studio.pick", { defaultValue: "Choose…" })}</option>
                {(cats.data || []).map((c) => <option key={c.id} value={c.id}>{categoryLabel(c)}</option>)}
              </select>
            </Field>
            <Field label={t("creator.storyType")}>
              <select className="input" value={f.story_type} onChange={set("story_type")}>
                <option value="single">{t("creator.single")}</option>
                <option value="series">{t("creator.series")}</option>
              </select>
            </Field>
            <Field label={t("creator.language")}>
              <select className="input" value={f.language} onChange={set("language")}>
                <option value="hindi">{t("creator.langHindi")}</option>
                <option value="english">{t("creator.langEnglish")}</option>
                <option value="hinglish">{t("creator.langHinglish")}</option>
              </select>
            </Field>
            <Field label={t("creator.ageRating")}>
              <select className="input" value={f.age_rating} onChange={set("age_rating")}>
                <option value="all">{t("creator.ageAll")}</option><option value="13+">13+</option><option value="16+">16+</option><option value="18+">18+</option>
              </select>
            </Field>
          </div>

          <Field label={t("creator.tags")}>
            <input className="input" value={f.tags} onChange={set("tags")} placeholder="bhoot, haveli, true story" />
          </Field>
        </section>

        {/* ═══ 3 · First episode ═══ */}
        <section className="cs-sec">
          <SecHead icon={<Layers size={20} />} n={3} title={t("creator.addEpisode")} sub={t("studio.epSub", { defaultValue: "This is what readers will read first" })} />

          <Field label={t("creator.episodeTitle")}>
            <input className="input" value={f.ep_title} onChange={set("ep_title")}
              placeholder={t("studio.epTitlePh", { defaultValue: "Episode 1 · optional" })} />
          </Field>

          <div className="cs-write-wrap">
            <textarea
              className="input cs-write"
              value={f.ep_content}
              onChange={set("ep_content")}
              placeholder={t("creator.episodeContent")}
            />
            <div className="cs-write-foot">
              <span className="cs-req">*</span> {t("studio.required", { defaultValue: "Required" })}
              <span style={{ flex: 1 }} />
              <span>{words} {t("studio.words", { defaultValue: "words" })} · {readMins} {t("story.readTime")}</span>
            </div>
          </div>
        </section>
      </div>

      {/* ═══ Sticky action bar ═══ */}
      <div className="cs-footer">
        <div className="container cs-footer-in">
          <div className="only-desktop cs-footer-hint">
            {canSubmit
              ? <span className="row gap-6" style={{ color: "var(--green)" }}><Check size={15} /> {t("studio.ready", { defaultValue: "Ready to publish" })}</span>
              : <span className="tertiary">{t("studio.needTitle", { defaultValue: "Add a title & story to continue" })}</span>}
          </div>
          <div className="cs-footer-btns">
            <button className="btn btn-ghost" disabled={busy || !canSubmit} onClick={() => submit(false)}>
              {busy ? <Loader2 size={18} className="spin" /> : <><Save size={17} /> {t("creator.save")}</>}
            </button>
            <button className="btn btn-primary" disabled={busy || !canSubmit} onClick={() => submit(true)}>
              {busy ? <Loader2 size={18} className="spin" /> : <><Send size={17} /> {t("creator.publish")}</>}
            </button>
          </div>
        </div>
      </div>

      <ThumbnailStudio
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        onDone={setThumb}
        suggestedText={f.title.trim()}
      />
    </div>
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
