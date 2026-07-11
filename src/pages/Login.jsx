import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  motion, AnimatePresence, useReducedMotion,
  useMotionValue, useSpring, useTransform,
} from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAuth } from "../store/auth";
import { errMsg } from "../lib/api";
import { EASE, riseVar, linkStyle } from "../lib/authUi";
import { EyeLogo } from "../components/Art";
import Seo from "../components/Seo";

/* Hard quotes — Pretika ki awaaz. Whispered in the dark under the register. */
const QUOTES = {
  hi: [
    "कुछ कहानियाँ पढ़ी नहीं जातीं… वो तुम्हें पढ़ती हैं।",
    "डर वहाँ ख़त्म नहीं होता, जहाँ कहानी ख़त्म होती है।",
    "रात के तीन बजे ये पन्ने खुद पलटते हैं।",
    "अंधेरे से मत डरो — उसमें छुपी कहानी से डरो।",
    "जो आख़िरी पन्ने तक गया, वो पहले जैसा नहीं लौटा।",
    "हर कहानी सच्ची है… बस किरदार बदल जाते हैं।",
  ],
  en: [
    "Some stories don't get read. They read you.",
    "Fear doesn't end where the story ends.",
    "At 3 AM, these pages turn themselves.",
    "Don't fear the dark — fear the story hiding in it.",
    "No one returns from the last page the same.",
    "Every story here is true. Only the names change.",
  ],
};

/* deterministic dust motes — same layout every render, no hydration jitter */
const MOTES = Array.from({ length: 12 }, (_, i) => ({
  left: (i * 83) % 100,
  delay: (i % 9) * 1.7,
  dur: 15 + (i % 7) * 3,
  s: 1.5 + (i % 3),
  mx: (i % 2 ? 1 : -1) * (8 + (i % 5) * 6),
}));

export default function Login() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const loc = useLocation();
  const login = useAuth((s) => s.login);
  const [form, setForm] = useState({ id: "", pw: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.id || !form.pw) return toast.error(t("common.somethingWrong"));
    setBusy(true);
    try {
      await login(form.id.trim(), form.pw);
      toast.success(t("toast.welcome"));
      nav(loc.state?.from || "/home", { replace: true });
    } catch (err) {
      toast.error(errMsg(err, t("auth.loginFailed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("auth.welcome")} sub={t("auth.welcomeSub")} stamp={t("auth.stampLogin")}>
      <form onSubmit={submit}>
        <Field placeholder={t("auth.email")} value={form.id} autoFocus
          autoComplete="username" onChange={(v) => setForm({ ...form, id: v })} />
        <PwField value={form.pw} show={show} setShow={setShow} autoComplete="current-password"
          placeholder={t("auth.password")} onChange={(v) => setForm({ ...form, pw: v })} />
        <motion.div variants={riseVar} className="deed-forgot">
          <Link to="/forgot" style={linkStyle}>{t("auth.forgot")}</Link>
        </motion.div>
        <GlowButton busy={busy}>{busy ? t("auth.loggingIn") : t("auth.login")}</GlowButton>
      </form>

      <motion.p variants={riseVar} className="deed-switch">
        {t("auth.noAccount")}{" "}
        <Link to="/register">{t("auth.register")}</Link>
      </motion.p>
    </AuthShell>
  );
}

/* ===================== shared auth primitives — "Shraapit Register" ========
   One cursed ledger page under a shaft of light in a dark room. No split
   panels, no input boxes: the form IS the document. Fields are ink lines,
   the CTA is a wax seal, a giant eye blinks in the dark behind the paper. */

let _uid = 0;
const nextId = (p) => `${p}-${(_uid++).toString(36)}`;

/* Wax seal — crimson blob with the embossed Pretika eye. */
function WaxSeal({ size = 58 }) {
  const [u] = useState(() => nextId("ws"));
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-hidden focusable="false">
      <defs>
        <radialGradient id={`${u}-wax`} cx="38%" cy="30%" r="82%">
          <stop offset="0%" stopColor="#d8483a" />
          <stop offset="46%" stopColor="#9c1c14" />
          <stop offset="100%" stopColor="#520c07" />
        </radialGradient>
      </defs>
      {/* wobbly wax blob */}
      <path d="M50 4 C63 2 75 9 82 19 C90 29 97 38 94 51 C91 62 96 71 87 79
               C78 89 66 88 54 94 C44 98 32 92 24 85 C14 77 4 70 5 56
               C6 44 3 32 11 22 C19 11 37 6 50 4 Z" fill={`url(#${u}-wax)`} />
      <circle cx="50" cy="50" r="35.5" fill="none" stroke="rgba(50,7,3,.6)" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(255,235,220,.30)" strokeWidth="1.8" />
      {/* embossed eye */}
      <path d="M28 50 Q50 34 72 50 Q50 66 28 50 Z" fill="none" stroke="#f6e7d8"
        strokeWidth="3" strokeLinejoin="round" opacity=".92" />
      <circle cx="50" cy="50" r="6.6" fill="#f6e7d8" opacity=".92" />
      <ellipse cx="50" cy="50" rx="2" ry="5.4" fill="#520c07" />
    </svg>
  );
}

/* Tiny seal mark inside the CTA button. */
function MiniSeal({ size = 21 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden focusable="false">
      <circle cx="20" cy="20" r="18" fill="rgba(30,4,2,.30)" />
      <circle cx="20" cy="20" r="14.5" fill="none" stroke="rgba(255,236,220,.5)" strokeWidth="1.6" />
      <path d="M9.5 20 Q20 12.5 30.5 20 Q20 27.5 9.5 20 Z" fill="none" stroke="#ffece0"
        strokeWidth="2" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="3" fill="#ffece0" />
    </svg>
  );
}

/* Bloody thumb impression — the "अंगूठा निशानी" corner of the deed. */
function Thumbprint({ size = 26 }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 40 48" aria-hidden focusable="false">
      <g fill="none" stroke="var(--crimson-mid)" strokeWidth="1.7" strokeLinecap="round" opacity=".5">
        <path d="M20 44 C9 40 5 30 6 20 C7 10 13 4 20 4 C27 4 33 10 34 20 C35 30 31 40 20 44 Z" />
        <path d="M20 39 C12 35 10 28 10.5 20 C11 12 15 8 20 8 C25 8 29 12 29.5 20 C30 28 28 35 20 39 Z" />
        <path d="M20 33 C15 30 14.5 25 15 19.5 C15.4 14 17 12 20 12 C23 12 24.6 14 25 19.5 C25.5 25 25 30 20 33 Z" />
        <path d="M20 27 C18 25.5 18.6 22 19 18.5 C19.2 16.6 19.4 16 20 16 C20.6 16 20.8 16.6 21 18.5 C21.4 22 22 25.5 20 27 Z" />
      </g>
    </svg>
  );
}

/* The watcher's eye on the password line — closed by default, opens to reveal. */
function LidEye({ open }) {
  const tr = { transition: "opacity .18s ease" };
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden focusable="false">
      <g style={{ ...tr, opacity: open ? 1 : 0 }}>
        <path d="M2.5 12 Q12 4.5 21.5 12 Q12 19.5 2.5 12 Z" fill="none"
          stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3.4" fill="currentColor" />
      </g>
      <g style={{ ...tr, opacity: open ? 0 : 1 }}>
        <path d="M2.5 11 Q12 18 21.5 11" fill="none" stroke="currentColor"
          strokeWidth="1.7" strokeLinecap="round" />
        <path d="M6.2 14.8 L4.9 17 M12 16.2 L12 18.8 M17.8 14.8 L19.1 17"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* Rotating whisper under the page — desktop only (CSS-gated). */
function Whisper() {
  const { i18n } = useTranslation();
  const reduce = useReducedMotion();
  const isHi = i18n.language?.startsWith("hi");
  const list = isHi ? QUOTES.hi : QUOTES.en;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((n) => (n + 1) % list.length), 6200);
    return () => clearInterval(id);
  }, [reduce, list.length]);
  return (
    <div className="deed-whisper" aria-hidden>
      <AnimatePresence mode="wait">
        <motion.span key={i} className="serif"
          initial={{ opacity: 0, y: 7, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -7, filter: "blur(5px)" }}
          transition={{ duration: 0.8, ease: EASE }}>
          “{list[i % list.length]}”
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function AuthShell({ title, sub, stamp, children, back = true }) {
  const nav = useNavigate();
  const { t, i18n } = useTranslation();
  const isHi = i18n.language?.startsWith("hi");
  const reduce = useReducedMotion();

  /* pointer → paper tilt + background parallax (stays flat on touch) */
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const rotX = useTransform(sy, (v) => v * -2.2);
  const rotY = useTransform(sx, (v) => v * 2.2);
  const bgX = useTransform(sx, (v) => v * 14);
  const bgY = useTransform(sy, (v) => v * 9);
  const onMove = (e) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  return (
    <div className={`deed-stage${isHi ? " deed-hi" : ""}`} onMouseMove={onMove}
      onMouseLeave={() => { mx.set(0); my.set(0); }}>
      {/* auth pages carry no indexable content */}
      <Seo title={title} robots="noindex, follow" />

      {/* the dark room: giant blinking eye, light shaft, dust, vignette */}
      <div className="deed-room" aria-hidden>
        <div className="deed-eyebg-pos">
          <motion.div className="deed-eyebg" style={reduce ? undefined : { x: bgX, y: bgY }}>
            <EyeLogo size={640} tile={false} />
          </motion.div>
        </div>
        <div className="deed-shaft" />
        {!reduce && MOTES.map((m, i) => (
          <span key={i} className="deed-mote" style={{
            left: `${m.left}%`, width: m.s, height: m.s, "--mx": `${m.mx}px`,
            animationDelay: `${m.delay}s`, animationDuration: `${m.dur}s`,
          }} />
        ))}
        <div className="deed-vign" />
      </div>

      {back && (
        <button onClick={() => nav(-1)} className="deed-back" aria-label={t("common.back")}>
          <ArrowLeft size={19} />
        </button>
      )}

      {/* the register page — one sheet, wax-sealed */}
      <div className="deed-center">
        <motion.div className="deed-wrap"
          style={reduce ? undefined : { rotateX: rotX, rotateY: rotY }}
          initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}>
          <div className="deed-seal"><WaxSeal /></div>

          <motion.div className="deed-sheet" initial="hide" animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } } }}>
            {stamp && <div className="deed-stamp">{stamp}</div>}

            <motion.header variants={riseVar} className="deed-head">
              <div className="deed-brand">Pretika</div>
              <h1 className={`deed-title ${isHi ? "display-hi" : "serif"}`}>{title}</h1>
              {sub && <p className="deed-sub">{sub}</p>}
            </motion.header>

            {children}

            <motion.footer variants={riseVar} className="deed-foot">
              <div className="deed-witness">
                <span>{t("auth.witness")}</span>
                <span className="deed-secure"><ShieldCheck size={11} /> {t("auth.secure")}</span>
              </div>
              <div className="deed-thumb">
                <Thumbprint />
                <i>{t("auth.thumb")}</i>
              </div>
            </motion.footer>
          </motion.div>
        </motion.div>
      </div>

      <Whisper />
    </div>
  );
}

/* Ink-line field — a blank on the deed, not an input box. Label sits above,
   the baseline inks crimson on focus. `placeholder` prop = the label text. */
export function Field({ placeholder, label, value, onChange, type = "text", autoFocus, autoComplete }) {
  return (
    <motion.label className="ink-field" variants={riseVar}>
      <span className="ink-label">{label ?? placeholder}</span>
      <input className="ink-input" type={type} value={value} autoFocus={autoFocus}
        autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
      <span className="ink-line" aria-hidden />
    </motion.label>
  );
}

const STRENGTH_TONES = ["#c43227", "#d97a1f", "#a9812f", "#1d7d5b"];

/* Password line — the watcher's eye opens to reveal. When `strength` (0–4)
   is passed, the baseline itself becomes the strength meter: ink fills it. */
export function PwField({ value, onChange, show, setShow, placeholder, label, autoComplete, strength = null }) {
  const { t } = useTranslation();
  return (
    <motion.label className="ink-field" variants={riseVar}>
      <span className="ink-label">{label ?? placeholder}</span>
      <input className="ink-input" style={{ paddingRight: 38 }}
        type={show ? "text" : "password"} value={value} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)} />
      <span className="ink-line" aria-hidden />
      {strength != null && (
        <span className="ink-strength" aria-hidden style={{
          width: `${strength * 25}%`,
          background: strength ? STRENGTH_TONES[strength - 1] : "transparent",
        }} />
      )}
      <button type="button" className="ink-eye"
        onClick={(e) => { e.preventDefault(); setShow(!show); }}
        aria-label={show ? t("auth.hidePw") : t("auth.showPw")} aria-pressed={show}>
        <LidEye open={show} />
      </button>
    </motion.label>
  );
}

/* The seal CTA — pressing it stamps the deed. */
export function GlowButton({ busy, children }) {
  return (
    <motion.div variants={riseVar}>
      <motion.button className="seal-btn" disabled={busy} whileTap={{ scale: 0.96 }}>
        <span className="seal-btn-mark" aria-hidden>
          {busy ? <span className="deed-spin" /> : <MiniSeal />}
        </span>
        {children}
      </motion.button>
    </motion.div>
  );
}
