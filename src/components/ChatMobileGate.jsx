import { useTranslation } from "react-i18next";
import { Smartphone } from "lucide-react";

// Chat is mobile-only (owner spec): laptop / iPad / TV show this instead of the
// inbox — "open on your phone". Chosen at ≥768px viewport (see useIsMobile).
export default function ChatMobileGate() {
  const { t } = useTranslation();
  return (
    <div className="chat-gate">
      <div className="chat-gate-icon"><Smartphone size={34} /></div>
      <h1 className="serif" style={{ fontSize: 22, fontWeight: 800 }}>{t("chat.mobileOnlyTitle")}</h1>
      <p style={{ color: "var(--text-tertiary)", maxWidth: 320, lineHeight: 1.6 }}>{t("chat.mobileOnlySub")}</p>
    </div>
  );
}
