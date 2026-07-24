import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Camera, Sparkles, Loader2, Check, UserRound,
  MapPin, Phone, AtSign, BadgeCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAuth } from "../store/auth";
import { api, put, post, unwrap, errMsg } from "../lib/api";
import { thumbFor } from "../lib/constants";
import ImageUploadPreview from "../components/ImageUploadPreview";
import Seo from "../components/Seo";

export default function EditProfile() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const fetchMe = useAuth((s) => s.fetchMe);
  const setUser = useAuth((s) => s.setUser);
  const promoteToCreator = useAuth((s) => s.promoteToCreator);
  const fileRef = useRef();

  const [f, setF] = useState({
    display_name: user?.display_name || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
    city: user?.city || "",
    state: user?.state || "",
  });
  const [avatar, setAvatar] = useState(user?.avatar_url);
  const [busy, setBusy] = useState(false);
  const [busyAvatar, setBusyAvatar] = useState(false);
  const [pending, setPending] = useState(null); // picked file awaiting preview approval
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // pick → preview the exact circle crop → upload (nothing goes up unconfirmed)
  const pickAvatar = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error(t("common.maxImage5"));
    setPending(file);
  };

  const uploadAvatar = async () => {
    if (!pending) return;
    setBusyAvatar(true);
    try {
      const data = await api.put("/users/me/avatar", fd(pending), { headers: { "Content-Type": "multipart/form-data" } }).then(unwrap);
      setAvatar(data.avatar_url);
      setPending(null);
      toast.success(t("profile.photoUpdated"));
      fetchMe().catch(() => {});
    } catch (e2) { toast.error(errMsg(e2)); }
    finally { setBusyAvatar(false); }
  };

  const save = async () => {
    setBusy(true);
    try {
      await put("/users/me", f);
      const me = await fetchMe();
      setUser(me);
      toast.success(t("toast.profileUpdated"));
      nav(-1);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const becomeCreator = async () => {
    try {
      await post("/users/me/become-creator");
      promoteToCreator();          // flip UI immediately (survives a failed refetch)
      toast.success(t("profile.creatorNow"));
      fetchMe().catch(() => {});   // reconcile fuller profile in the background
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="app-shell" style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <Seo title="Edit Profile" robots="noindex, follow" />

      <header className="ep-head">
        <div className="row gap-12">
          <button onClick={() => nav(-1)} aria-label={t("common.back")}><ArrowLeft size={22} /></button>
          <div className="section-title">{t("profile.edit")}</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
          {busy ? <><Loader2 size={15} className="spin" /> {t("common.saving")}</> : <><Check size={15} /> {t("common.save")}</>}
        </button>
      </header>

      <div className="container ep-wrap">
        {/* ═══ Photo ═══ */}
        <div className="ep-avatar-block">
          <div className="ep-avatar" style={{ filter: busyAvatar ? "brightness(.6)" : "none" }}>
            <img src={thumbFor(avatar, user?.username)} alt="" />
            {busyAvatar && (
              <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff" }}>
                <Loader2 size={22} className="spin" />
              </span>
            )}
            <button className="ep-cam" onClick={() => !busyAvatar && fileRef.current?.click()} aria-label={t("profile.changePhoto")}>
              <Camera size={16} />
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickAvatar} />
          </div>
          <div className="ep-name-preview">
            <div className="row gap-6" style={{ justifyContent: "center" }}>
              <span className="serif" style={{ fontWeight: 800, fontSize: 18 }}>{f.display_name || user?.username}</span>
              {user?.is_verified_creator && <BadgeCheck size={16} color="var(--blue)" />}
            </div>
            <div className="tertiary" style={{ fontSize: 12.5 }}>@{user?.username}</div>
          </div>
          <div className="tertiary" style={{ fontSize: 11.5 }}>{t("profile.imgFormats")}</div>
        </div>

        {/* ═══ About you ═══ */}
        <section className="ep-sec">
          <div className="ep-sec-title"><UserRound size={16} /> {t("profile.about", { defaultValue: "About you" })}</div>

          <Field label={t("auth.displayName")} hint={`${f.display_name.length}/50`}>
            <input className="input" value={f.display_name} onChange={set("display_name")} maxLength={50}
              placeholder={t("auth.displayName")} />
          </Field>

          <Field label={t("profile.bio")} hint={`${f.bio.length}/500`}>
            <textarea className="input" rows={3} value={f.bio} onChange={set("bio")} maxLength={500}
              placeholder={t("profile.bioPh", { defaultValue: "Tell readers about yourself…" })} />
          </Field>

          <Field label={t("auth.username")}>
            <div className="ep-readonly">
              <AtSign size={16} className="tertiary" />
              <span style={{ fontWeight: 600 }}>{user?.username}</span>
              <span className="tertiary" style={{ marginLeft: "auto", fontSize: 12 }}>{t("profile.usernameFixed", { defaultValue: "can't be changed" })}</span>
            </div>
          </Field>
        </section>

        {/* ═══ Contact & location ═══ */}
        <section className="ep-sec">
          <div className="ep-sec-title"><MapPin size={16} /> {t("profile.contact", { defaultValue: "Contact & location" })}</div>

          <Field label={t("profile.phone")} icon={<Phone size={15} />}>
            <input className="input ep-input-icon" value={f.phone} onChange={set("phone")} inputMode="tel"
              placeholder="+91…" />
          </Field>
          <div className="row gap-12">
            <Field label={t("profile.city")} style={{ flex: 1 }}><input className="input" value={f.city} onChange={set("city")} /></Field>
            <Field label={t("profile.state")} style={{ flex: 1 }}><input className="input" value={f.state} onChange={set("state")} /></Field>
          </div>
        </section>

        {/* ═══ Become creator ═══ */}
        {!user?.is_creator && (
          <button onClick={becomeCreator} className="ep-creator-cta">
            <span className="ep-creator-ic"><Sparkles size={22} /></span>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{ fontWeight: 800, fontSize: 14.5 }}>{t("profile.becomeCreator")}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{t("creator.becomeSub")}</div>
            </div>
          </button>
        )}

        <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={save} disabled={busy}>
          {busy ? <><Loader2 size={17} className="spin" /> {t("common.saving")}</> : <><Check size={17} /> {t("common.save")}</>}
        </button>
      </div>

      <ImageUploadPreview
        open={!!pending}
        kind="avatar"
        file={pending}
        busy={busyAvatar}
        onCancel={() => setPending(null)}
        onPickAnother={() => fileRef.current?.click()}
        onConfirm={uploadAvatar}
      />
    </div>
  );
}

function fd(file) { const d = new FormData(); d.append("file", file); return d; }

function Field({ label, hint, icon, style, children }) {
  return (
    <div className="ep-field" style={style}>
      <div className="ep-field-top">
        <label className="field-label" style={{ margin: 0 }}>{label}</label>
        {hint && <span className="ep-hint">{hint}</span>}
      </div>
      {icon ? <div className="ep-icon-wrap"><span className="ep-icon">{icon}</span>{children}</div> : children}
    </div>
  );
}
