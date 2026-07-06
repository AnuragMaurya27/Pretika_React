import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { post, errMsg } from "../lib/api";
import { AuthShell, Field, GlowButton } from "./Login";
import { riseVar } from "../lib/authUi";

export default function Forgot() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) return toast.error("Enter a valid email");
    setBusy(true);
    try {
      await post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
      toast.success("Reset link sent");
    } catch (e2) {
      toast.error(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("auth.forgotTitle")} sub={t("auth.forgotSub")} stamp={t("auth.stampForgot")}>
      {sent ? (
        <motion.div variants={riseVar} className="deed-sent">
          <MailCheck size={40} color="var(--crimson)" strokeWidth={1.7} />
          <p>{t("auth.verifyEmailNote")}</p>
          <Link to="/login" className="btn btn-outline btn-block" style={{ marginTop: 18 }}>
            {t("auth.backToLogin")}
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={submit}>
          <Field type="email" placeholder={t("auth.emailOnly")} value={email}
            autoComplete="email" onChange={setEmail} autoFocus />
          <GlowButton busy={busy}>{busy ? t("common.loading") : t("auth.sendLink")}</GlowButton>
          <motion.p variants={riseVar} className="deed-switch">
            <Link to="/login">{t("auth.backToLogin")}</Link>
          </motion.p>
        </form>
      )}
    </AuthShell>
  );
}
