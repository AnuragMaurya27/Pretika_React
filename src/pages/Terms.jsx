import { Link } from "react-router-dom";
import StaticPage, { Section, Ul } from "../components/StaticPage";

export default function Terms() {
  return (
    <StaticPage
      title="Terms of Use"
      subtitle="The ground rules for reading, writing and haunting responsibly on Pretika."
      path="/terms"
      description="Pretika's terms of use — accounts, user-generated content, content policy, copyright complaints and disclaimers."
      updated="July 4, 2026"
    >
      <Section title="1. Acceptance of terms">
        <p>
          These Terms of Use govern your access to <strong>pretika.in</strong> (&quot;Pretika&quot;,
          &quot;the service&quot;). By browsing, reading, or creating an account you agree to these terms
          and to our <Link to="/privacy">Privacy Policy</Link>. If you do not agree, please do not
          use the service.
        </p>
      </Section>

      <Section title="2. Eligibility & content warning">
        <p>
          Pretika publishes horror fiction that can be intense, frightening or disturbing. The
          service is intended for users aged 13 and above; reader discretion is advised. Stories
          on Pretika are works of fiction — any resemblance to real persons or events is
          coincidental unless stated by the author.
        </p>
      </Section>

      <Section title="3. Your account">
        <p>
          You are responsible for your account and everything that happens under it. Keep your
          password safe, provide accurate information, and do not impersonate others or create
          accounts for abusive purposes. We may suspend accounts that violate these terms.
        </p>
      </Section>

      <Section title="4. Your content">
        <p>
          Writers keep full ownership of the stories they publish on Pretika. By publishing, you
          grant Pretika a non-exclusive, worldwide licence to host, display, distribute and
          promote your content on the service (including previews and social sharing). You can
          delete your content at any time, which ends this licence except for cached copies.
        </p>
        <p>You promise that content you publish:</p>
        <Ul items={[
          "is your own original work, or you have the rights to publish it;",
          "does not contain hate speech, harassment, or threats against real people;",
          "does not contain sexual content involving minors — zero tolerance, reported to authorities;",
          "does not reveal someone's private information or promote real-world violence or illegal acts;",
          "is not spam, scraped, or plagiarised content.",
        ]} />
        <p>We may remove content or restrict accounts that break these rules.</p>
      </Section>

      <Section title="5. Free to read">
        <p>
          Reading on Pretika is free. We do not sell virtual currency or paid unlocks; the service
          is supported by advertising (see below). If we ever introduce paid features, these terms
          will be updated first.
        </p>
      </Section>

      <Section title="6. Copyright complaints">
        <p>
          We respect intellectual property. If you believe content on Pretika infringes your
          copyright, send a takedown request via the <Link to="/contact">contact page</Link> with
          (a) the link to the infringing content, (b) proof of your ownership, and (c) your
          contact details. We review complaints promptly and remove infringing content. Repeat
          infringers lose their accounts.
        </p>
      </Section>

      <Section title="7. Advertising">
        <p>
          Pretika may display third-party advertisements (for example via Google AdSense) to keep
          the service free. Advertisers are responsible for their own content; a listing on
          Pretika is not an endorsement. See the <Link to="/privacy">Privacy Policy</Link> for how
          advertising cookies work and how to opt out of personalisation.
        </p>
      </Section>

      <Section title="8. Disclaimers & limitation of liability">
        <p>
          The service is provided &quot;as is&quot; without warranties of any kind. Stories are the views
          of their authors, not of Pretika. To the maximum extent permitted by law, Pretika is not
          liable for indirect or consequential damages arising from your use of the service; our
          total liability is limited to the amount you paid us in the previous 12 months.
        </p>
      </Section>

      <Section title="9. Governing law">
        <p>
          These terms are governed by the laws of India, and disputes are subject to the exclusive
          jurisdiction of the courts of India.
        </p>
      </Section>

      <Section title="10. Changes">
        <p>
          We may update these terms as the service evolves; the date above reflects the latest
          version. Continued use after changes means you accept the updated terms. Questions?{" "}
          <Link to="/contact">Contact us</Link>.
        </p>
      </Section>
    </StaticPage>
  );
}
