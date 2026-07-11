import { PhoneMissed } from "lucide-react";
import { useTranslation } from "react-i18next";

/** MissedCallCard — call-log style entry ("4 missed calls · 3:14 AM"). */
export default function MissedCallCard({ callerName, count = 1, time }) {
  const { t } = useTranslation();
  const label =
    count > 1 ? t("chats.missedCallMany", { n: count }) : t("chats.missedCallOne");
  return (
    <div className="cht-call" role="note">
      <span className="cht-call-ic"><PhoneMissed size={17} /></span>
      <div>
        <div className="cht-call-title">{label}</div>
        <div className="cht-call-sub">
          {callerName ? `${callerName} · ` : ""}{time || ""}
        </div>
      </div>
    </div>
  );
}
