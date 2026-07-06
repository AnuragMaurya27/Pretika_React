import { Link } from "react-router-dom";
import StaticPage, { Section, Ul } from "../components/StaticPage";

export default function Privacy() {
  return (
    <StaticPage
      title="Privacy Policy"
      subtitle="What we collect, why we collect it, and the choices you have."
      path="/privacy"
      description="Pretika's privacy policy — the data we collect, how cookies and advertising (including Google AdSense) work on the site, and your rights."
      updated="July 4, 2026"
    >
      <Section title="Who we are">
        <p>
          Pretika (&quot;we&quot;, &quot;us&quot;) operates <strong>pretika.in</strong>, a platform for reading and
          writing Hindi horror stories. This policy explains what information we collect when you
          use the website and the choices you have. By using Pretika you agree to this policy.
        </p>
      </Section>

      <Section title="Information we collect">
        <Ul items={[
          <><strong>Account information</strong> — when you register we collect your email address, username, display name and password (stored as a secure hash). Adding a bio or avatar is optional.</>,
          <><strong>Content you create</strong> — stories, episodes, comments, ratings, bookmarks and follows are stored so the service can work.</>,
          <><strong>Usage information</strong> — pages visited, stories read and reading progress, so we can resume your reading and recommend stories.</>,
          <><strong>Device information</strong> — standard web logs such as IP address, browser type and screen size, used for security and to keep the site working well on your device.</>,
        ]} />
        <p>We do not knowingly collect government IDs, precise location, or contact lists.</p>
      </Section>

      <Section title="How we use your information">
        <Ul items={[
          "To provide the service — accounts, publishing and reading progress.",
          "To keep the community safe — moderation of reported content and prevention of abuse or fraud.",
          "To improve Pretika — understanding which stories and features readers enjoy.",
          "To communicate with you — service emails such as password resets. We do not sell your personal information to anyone.",
        ]} />
      </Section>

      <Section title="Cookies & local storage">
        <p>
          Pretika uses browser <em>localStorage</em> to keep you signed in (authentication tokens)
          and to remember preferences such as your reading theme, font size and language. Cookies
          and similar technologies may also be set by third-party services described below. You
          can clear these at any time from your browser settings; you may need to sign in again
          afterwards.
        </p>
      </Section>

      <Section title="Advertising (Google AdSense)">
        <p>
          We may show advertisements served by Google AdSense and other third-party vendors to
          keep Pretika free. Please note:
        </p>
        <Ul items={[
          <>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites.</>,
          <>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the Internet.</>,
          <>You may opt out of personalised advertising by visiting{" "}<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>, or opt out of some third-party vendors' cookies at{" "}<a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.</>,
          <>For more on how Google uses data from sites that use its services, see{" "}<a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">policies.google.com/technologies/partner-sites</a>.</>,
        ]} />
      </Section>

      <Section title="Data retention & security">
        <p>
          We keep your account data for as long as your account exists. Published stories and
          comments remain until you delete them or your account. We use industry-standard
          safeguards (encrypted connections, hashed passwords, token-based authentication), but no
          method of transmission over the Internet is 100% secure.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Pretika hosts horror fiction and is not directed at children under 13. If you believe a
          child under 13 has created an account, please <Link to="/contact">contact us</Link> and
          we will remove it.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can edit your profile at any time from the app. You may also request a copy of your
          data or deletion of your account by writing to us via the{" "}
          <Link to="/contact">contact page</Link>; we respond within 30 days.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will be announced on the
          site, and the &quot;last updated&quot; date above always reflects the current version.
        </p>
      </Section>
    </StaticPage>
  );
}
