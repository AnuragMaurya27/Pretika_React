import { PhoneMissed } from "lucide-react";

/** MissedCallCard — call-log style entry ("4 missed calls · 3:14 AM"). */
export default function MissedCallCard({ callerName, count = 1, time }) {
  const label =
    count > 1 ? `${count} missed calls` : "Missed voice call";
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
