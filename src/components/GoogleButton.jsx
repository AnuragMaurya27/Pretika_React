import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../store/auth";
import { errMsg } from "../lib/api";

// Web OAuth client ID. Override with VITE_GOOGLE_CLIENT_ID for your own web origin.
const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "625195614058-9tikf68htdqhdpd3hk4ranq2kp3tuu30.apps.googleusercontent.com";

let gisPromise = null;
function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return gisPromise;
}

/**
 * Renders Google's official Sign-in button (popup flow → id_token).
 * This is more reliable than One Tap / FedCM across browsers.
 * NOTE: the OAuth client must list this site's origin under
 *       "Authorized JavaScript origins" in Google Cloud Console.
 */
export default function GoogleButton() {
  const nav = useNavigate();
  const googleLogin = useAuth((s) => s.googleLogin);
  const holder = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !holder.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          ux_mode: "popup",
          callback: async (resp) => {
            try {
              await googleLogin(resp.credential);
              toast.success("Signed in");
              nav("/home", { replace: true });
            } catch (e) {
              toast.error(errMsg(e, "Google sign-in failed"));
            }
          },
        });
        holder.current.innerHTML = "";
        window.google.accounts.id.renderButton(holder.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: Math.min(holder.current.offsetWidth || 320, 400),
          logo_alignment: "center",
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={holder} style={{ display: "flex", justifyContent: "center", minHeight: 44 }} />;
}
