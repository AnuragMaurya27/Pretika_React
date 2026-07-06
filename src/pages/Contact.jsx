import { Mail } from "lucide-react";
import StaticPage, { Section, Ul } from "../components/StaticPage";

// Public support inbox shown on the site. Change this one constant to move to
// an official address (e.g. support@pretika.in) later.
const SUPPORT_EMAIL = "shinchan563200@gmail.com";

export default function Contact() {
  return (
    <StaticPage
      title="Contact Us"
      subtitle="Questions, feedback, content reports or business enquiries — we read everything."
      path="/contact"
      description="Contact the Pretika team — support, content reports, copyright complaints and business enquiries for India's Hindi horror-story platform."
    >
      <Section title="Email us">
        <p>
          The fastest way to reach the Pretika team is email. We usually reply within 48 hours
          (weekends can be a little slower — even we need to sleep with the lights on sometimes).
        </p>
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

      <Section title="What to include">
        <Ul items={[
          "Account issues — the email/username on your account and what went wrong.",
          "Content reports — a link to the story, episode or comment, and why you're reporting it.",
          "Copyright complaints — the link to the infringing content, proof of your ownership, and your contact details.",
          "Business & advertising enquiries — a short intro of who you are and what you have in mind.",
        ]} />
      </Section>

      <Section title="Report content in-app">
        <p>
          You can also report any comment directly from its ⋮ menu inside a story. Reports go to
          the moderation queue and are reviewed against our content policy.
        </p>
      </Section>
    </StaticPage>
  );
}
