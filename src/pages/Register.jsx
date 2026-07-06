import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAuth } from "../store/auth";
import { useLang } from "../store/lang";
import { errMsg } from "../lib/api";
import { AuthShell, Field, PwField, GlowButton } from "./Login";
import { riseVar } from "../lib/authUi";

/* strength 0–4 — mirrors valid(): length 8+, upper, lower, digit.
   Rendered by PwField as ink filling the signature line itself. */
const pwScore = (pw) =>
  [pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /\d/.test(pw)].filter(Boolean).length;

export default function Register() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const register = useAuth((s) => s.register);
  const lang = useLang((s) => s.lang);
  const [f, setF] = useState({ username: "", email: "", display_name: "", password: "", referral: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const valid = () => {
    if (f.username.length < 3) return "Username must be at least 3 characters";
    if (!/^[\w]+$/.test(f.username)) return "Username: letters, numbers & _ only";
    if (!/.+@.+\..+/.test(f.email)) return "Enter a valid email";
    if (pwScore(f.password) < 4)
      return "Password: 8+ chars, 1 upper, 1 lower, 1 digit";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = valid();
    if (err) return toast.error(err);
    setBusy(true);
    try {
      await register({
        username: f.username.trim(),
        email: f.email.trim(),
        password: f.password,
        display_name: f.display_name.trim() || undefined,
        referral_code: f.referral.trim() || undefined,
        preferred_language: lang,
      });
      toast.success(t("auth.verifyEmailNote"), { duration: 5000 });
      nav("/login", { replace: true });
    } catch (e2) {
      toast.error(errMsg(e2, "Registration failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("auth.createTitle")} sub={t("auth.createSub")} stamp={t("auth.stampRegister")}>
      <form onSubmit={submit}>
        <div className="ink-row">
          <Field placeholder={t("auth.username")} value={f.username}
            autoComplete="username" onChange={set("username")} />
          <Field placeholder={t("auth.displayName")} value={f.display_name}
            autoComplete="name" onChange={set("display_name")} />
        </div>
        <Field type="email" placeholder={t("auth.emailOnly")} value={f.email}
          autoComplete="email" onChange={set("email")} />
        <PwField value={f.password} show={show} setShow={setShow}
          placeholder={t("auth.password")} autoComplete="new-password"
          strength={pwScore(f.password)} onChange={set("password")} />
        <Field placeholder={t("auth.referral")} value={f.referral} onChange={set("referral")} />
        <GlowButton busy={busy}>{busy ? t("auth.creating") : t("auth.register")}</GlowButton>
      </form>

      <motion.p variants={riseVar} className="deed-switch">
        {t("auth.haveAccount")}{" "}
        <Link to="/login">{t("auth.login")}</Link>
      </motion.p>
    </AuthShell>
  );
}
