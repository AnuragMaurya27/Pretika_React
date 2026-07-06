import { Link } from "react-router-dom";
import StaticPage, { Section, Ul } from "../components/StaticPage";

export default function About() {
  return (
    <StaticPage
      title="About Pretika"
      subtitle="India's home for spine-chilling Hindi horror stories — read, write & feel the fear."
      path="/about"
      description="Pretika is a Hindi horror-story platform where readers discover spine-chilling bhootiya kahaniyan and writers publish their own horror stories."
    >
      <Section title="What is Pretika?">
        <p>
          Pretika (प्रेतिका) is a storytelling platform dedicated to one thing we all secretly love:
          fear. We publish original Hindi, Hinglish and English horror fiction — ghost stories,
          haunted-house tales, urban legends, chudail and jinn lore, village horrors and
          psychological thrillers — written by a growing community of independent Indian writers.
        </p>
        <p>
          Every story on Pretika is written by a real person, for readers who want the kind of
          desi horror that big platforms rarely publish: kahaniyan rooted in our own towns,
          rituals, folklore and fears.
        </p>
      </Section>

      <Section title="What you can do here">
        <Ul items={[
          <>Read — thousands of free horror stories and episode-based series, with a distraction-free reader, adjustable fonts and reading themes.</>,
          <>Write — anyone can <Link to="/become-creator">become a creator</Link>, publish stories in episodes, and build an audience.</>,
          <>Support creators — readers can cheer writers on with likes, ratings and comments, and follow them for new episodes.</>,
          <>Follow — keep up with your favourite storytellers and never miss a new episode.</>,
        ]} />
      </Section>

      <Section title="Our content standards">
        <p>
          Horror is intense by nature, but Pretika is fiction-first and community-moderated. We do
          not allow hateful content, sexual content involving minors, real-personal-information
          exposure, or content that promotes real-world harm. Readers can report any story or
          comment, and our team reviews reports. See our <Link to="/terms">Terms of Use</Link> for
          the full content policy.
        </p>
      </Section>

      <Section title="Who runs Pretika?">
        <p>
          Pretika is an independent Indian platform built by a small team that grew up trading
          ghost stories after lights-out. Our mission is simple: give Hindi horror — and its
          writers — the home it deserves.
        </p>
        <p>
          Questions, feedback or story tips? We would love to hear from you on the{" "}
          <Link to="/contact">contact page</Link>.
        </p>
      </Section>
    </StaticPage>
  );
}
