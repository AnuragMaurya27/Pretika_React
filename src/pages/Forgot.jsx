import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { errMsg } from "../lib/api";
import { sendOtp, resetPasswordOtp } from "../lib/otp";
import { AuthShell, PwField, PhoneField, OtpStep, GlowButton } from "./Login";

const PHONE_RE = /^[6-9]\d{9}$/;
const pwScore = (pw) =>
  [pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /\d/.test(pw)].filter(Boolean).length;

export default function Forgot() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("phone"); // "phone" | "reset"
  const [vid, setVid] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  // Step 1 — SMS a reset code to a registered, verified phone.
  const submitPhone = async (e) => {
    e.preventDefault();
    if (!PHONE_RE.test(phone.trim())) return toast.error(t("auth.phoneRule"));
    setBusy(true);
    try {
      const data = await sendOtp(phone.trim(), "forgot_password");
      setVid(data?.verification_id || "");
      setStep("reset");
      toast.success(t("auth.otpSent"));
    } catch (e2) {
      toast.error(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  // Step 2 — verify the OTP and set the new password in one shot.
  const submitReset = async (e) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(code.trim())) return toast.error(t("auth.otpRule"));
    if (pwScore(pw) < 4) return toast.error(t("auth.pwRule"));
    setBusy(true);
    try {
      await resetPasswordOtp(vid, code.trim(), pw);
      toast.success(t("auth.resetDone"));
      nav("/login", { replace: true });
    } catch (e2) {
      toast.error(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("auth.forgotTitle")} sub={t("auth.forgotPhoneSub")} stamp={t("auth.stampForgot")}>
      {step === "phone" ? (
        <form onSubmit={submitPhone}>
          <PhoneField value={phone} onChange={setPhone} autoFocus />
          <GlowButton busy={busy}>{busy ? t("auth.sendingOtp") : t("auth.sendOtp")}</GlowButton>
          <p className="deed-switch" style={{ marginTop: 15 }}>
            <Link to="/login">{t("auth.backToLogin")}</Link>
          </p>
        </form>
      ) : (
        <OtpStep
          phone={`+91 ${phone.trim()}`}
          code={code} setCode={setCode} busy={busy}
          onSubmit={submitReset}
          onBack={() => setStep("phone")}
          onResend={async () => {
            const data = await sendOtp(phone.trim(), "forgot_password");
            setVid(data?.verification_id || "");
          }}
          submitLabel={t("auth.verifyReset")}
        >
          <PwField value={pw} show={show} setShow={setShow} placeholder={t("auth.newPassword")}
            autoComplete="new-password" strength={pwScore(pw)} onChange={setPw} />
        </OtpStep>
      )}
    </AuthShell>
  );
}
