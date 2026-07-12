import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import StaticPage, { Section, Ul } from "../components/StaticPage";

// Public support inbox shown on the site. Change this one constant to move to
// an official address (e.g. support@pretika.in) later.
const SUPPORT_EMAIL = "shinchan563200@gmail.com";

/* Copy in both UI languages — picked live by i18n.language. */
const COPY = {
  en: {
    title: "Contact Us",
    subtitle: "Questions, feedback, content reports or business enquiries — we read everything.",
    emailUs: "Email us",
    emailP: (
      <>
        The fastest way to reach the Pretika team is email. We usually reply within 48 hours
        (weekends can be a little slower — even we need to sleep with the lights on sometimes).
      </>
    ),
    include: "What to include",
    includeItems: [
      "Account issues — the email/username on your account and what went wrong.",
      "Content reports — a link to the story, episode or comment, and why you're reporting it.",
      "Copyright complaints — the link to the infringing content, proof of your ownership, and your contact details.",
      "Business & advertising enquiries — a short intro of who you are and what you have in mind.",
    ],
    inApp: "Report content in-app",
    inAppP: (
      <>
        You can also report any comment directly from its ⋮ menu inside a story. Reports go to
        the moderation queue and are reviewed against our content policy.
      </>
    ),
  },
  hi: {
    title: "संपर्क करें",
    subtitle: "सवाल, सुझाव, कंटेंट रिपोर्ट या बिज़नेस पूछताछ — हम सब कुछ पढ़ते हैं।",
    emailUs: "हमें ईमेल करें",
    emailP: (
      <>
        प्रेतिका टीम तक पहुँचने का सबसे तेज़ तरीक़ा ईमेल है। हम आमतौर पर 48 घंटे में जवाब देते हैं
        (वीकेंड पर थोड़ी देर हो सकती है — कभी-कभी हमें भी बत्ती जलाकर सोना पड़ता है)।
      </>
    ),
    include: "ईमेल में क्या लिखें",
    includeItems: [
      "अकाउंट की दिक्कत — आपके अकाउंट का ईमेल/यूज़रनेम और क्या गड़बड़ हुई।",
      "कंटेंट रिपोर्ट — कहानी, एपिसोड या कमेंट का लिंक, और रिपोर्ट करने की वजह।",
      "कॉपीराइट शिकायत — कॉपी किए गए कंटेंट का लिंक, इस बात का सबूत कि कंटेंट आपका है, और आपकी कॉन्टैक्ट डिटेल्स।",
      "बिज़नेस और विज्ञापन की बात — आप कौन हैं और क्या सोच रहे हैं, इसका छोटा सा परिचय।",
    ],
    inApp: "ऐप के अंदर रिपोर्ट करें",
    inAppP: (
      <>
        किसी भी कमेंट को कहानी के अंदर उसके ⋮ मेन्यू से सीधे रिपोर्ट भी कर सकते हैं। हर रिपोर्ट
        हमारी मॉडरेशन टीम के पास जाती है और कंटेंट पॉलिसी के हिसाब से जाँची जाती है।
      </>
    ),
  },
};

export default function Contact() {
  const { i18n } = useTranslation();
  const c = COPY[i18n.language === "hi" ? "hi" : "en"];
  return (
    <StaticPage
      title={c.title}
      subtitle={c.subtitle}
      path="/contact"
      seoTitle="Contact Us"
      description="Contact the Pretika team — support, content reports, copyright complaints and business enquiries for India's Hindi horror-story platform."
    >
      <Section title={c.emailUs}>
        <p>{c.emailP}</p>
        <p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="row gap-8"
            style={{ display: "inline-flex", fontWeight: 700, color: "var(--indigo-600)" }}
          >
            <Mail size={16} /> {SUPPORT_EMAIL}
          </a>
        </p>
      </Section>

      <Section title={c.include}>
        <Ul items={c.includeItems} />
      </Section>

      <Section title={c.inApp}>
        <p>{c.inAppP}</p>
      </Section>
    </StaticPage>
  );
}
