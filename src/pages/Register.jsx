import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAuth } from "../store/auth";
import { useLang } from "../store/lang";
import { errMsg } from "../lib/api";
import { sendOtp, verifyOtp } from "../lib/otp";
import { AuthShell, Field, PwField, PhoneField, OtpStep, GlowButton } from "./Login";
import { riseVar } from "../lib/authUi";
import GoogleButton from "../components/GoogleButton";

/* strength 0–4 — mirrors valid(): length 8+, upper, lower, digit.
   Rendered by PwField as ink filling the signature line itself. */
const pwScore = (pw) =>
  [pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /\d/.test(pw)].filter(Boolean).length;

const PHONE_RE = /^[6-9]\d{9}$/; // Indian 10-digit mobile

export default function Register() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const register = useAuth((s) => s.register);
  const login = useAuth((s) => s.login);
  const lang = useLang((s) => s.lang);
  // Invite links land as /register?ref=CODE — prefill so the referral actually sticks.
  const [params] = useSearchParams();
  const [f, setF] = useState({
    username: "", email: "", display_name: "", password: "", phone: "",
    referral: (params.get("ref") || "").trim().toUpperCase(),
  });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [vid, setVid] = useState("");
  const [code, setCode] = useState("");
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const validForm = () => {
    if (f.username.length < 3) return t("auth.usernameMin");
    if (!/^[\w]+$/.test(f.username)) return t("auth.usernameChars");
    if (!/.+@.+\..+/.test(f.email)) return t("auth.validEmail");
    if (pwScore(f.password) < 4) return t("auth.pwRule");
    if (!PHONE_RE.test(f.phone.trim())) return t("auth.phoneRule");
    return null;
  };

  // Step 1 — validate details, then SMS an OTP to the phone.
  const submitForm = async (e) => {
    e.preventDefault();
    const err = validForm();
    if (err) return toast.error(err);
    setBusy(true);
    try {
      const data = await sendOtp(f.phone.trim(), "signup");
      setVid(data?.verification_id || "");
      setStep("otp");
      toast.success(t("auth.otpSent"));
    } catch (e2) {
      toast.error(errMsg(e2, t("auth.registerFailed")));
    } finally {
      setBusy(false);
    }
  };

  // Step 2 — verify the OTP, create the account (phone verified), then log straight in.
  const submitOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(code.trim())) return toast.error(t("auth.otpRule"));
    setBusy(true);
    try {
      await verifyOtp(vid, code.trim());
      await register({
        username: f.username.trim(),
        email: f.email.trim(),
        password: f.password,
        display_name: f.display_name.trim() || undefined,
        referral_code: f.referral.trim() || undefined,
        preferred_language: lang,
        phone: f.phone.trim(),
        country_code: "91",
        verification_id: vid,
      });
      await login(f.email.trim(), f.password);
      toast.success(t("toast.welcome"));
      nav("/home", { replace: true });
    } catch (e2) {
      toast.error(errMsg(e2, t("auth.registerFailed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("auth.createTitle")} sub={t("auth.createSub")} stamp={t("auth.stampRegister")}>
      {step === "form" ? (
        <>
          <form onSubmit={submitForm}>
            <div className="ink-row">
              <Field placeholder={t("auth.username")} value={f.username}
                autoComplete="username" onChange={set("username")} />
              <Field placeholder={t("auth.displayName")} value={f.display_name}
                autoComplete="name" onChange={set("display_name")} />
            </div>
            <Field type="email" placeholder={t("auth.emailOnly")} value={f.email}
              autoComplete="email" onChange={set("email")} />
            <PhoneField value={f.phone} onChange={set("phone")} />
            <PwField value={f.password} show={show} setShow={setShow}
              placeholder={t("auth.password")} autoComplete="new-password"
              strength={pwScore(f.password)} onChange={set("password")} />
            <Field placeholder={t("auth.referral")} value={f.referral} onChange={set("referral")} />
            {f.referral.trim() && (
              <motion.p variants={riseVar} className="muted" style={{ fontSize: 12, margin: "-4px 0 10px", lineHeight: 1.5 }}>
                {t("auth.referralPerk")}
              </motion.p>
            )}
            <GlowButton busy={busy}>{busy ? t("auth.sendingOtp") : t("auth.sendOtp")}</GlowButton>
          </form>

          <motion.div variants={riseVar} className="deed-or">{t("auth.or")}</motion.div>
          <GoogleButton referral={f.referral.trim() || undefined} />

          <motion.p variants={riseVar} className="deed-switch">
            {t("auth.haveAccount")}{" "}
            <Link to="/login">{t("auth.login")}</Link>
          </motion.p>
        </>
      ) : (
        <OtpStep
          phone={`+91 ${f.phone.trim()}`}
          code={code} setCode={setCode} busy={busy}
          onSubmit={submitOtp}
          onBack={() => setStep("form")}
          onResend={async () => {
            const data = await sendOtp(f.phone.trim(), "signup");
            setVid(data?.verification_id || "");
          }}
          submitLabel={t("auth.verifyCreate")}
        />
      )}
    </AuthShell>
  );
}
