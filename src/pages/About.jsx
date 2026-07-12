import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StaticPage, { Section, Ul } from "../components/StaticPage";

/* Full-page copy in both UI languages — picked live by i18n.language.
   SEO title/description stay English (crawler-stable). */
const COPY = {
  en: {
    title: "About Pretika",
    subtitle: "India's home for spine-chilling Hindi horror stories — read, write & feel the fear.",
    what: "What is Pretika?",
    what1: (
      <>
        Pretika (प्रेतिका) is a storytelling platform dedicated to one thing we all secretly love:
        fear. We publish original Hindi, Hinglish and English horror fiction — ghost stories,
        haunted-house tales, urban legends, chudail and jinn lore, village horrors and
        psychological thrillers — written by a growing community of independent Indian writers.
      </>
    ),
    what2: (
      <>
        Every story on Pretika is written by a real person, for readers who want the kind of
        desi horror that big platforms rarely publish: kahaniyan rooted in our own towns,
        rituals, folklore and fears.
      </>
    ),
    canDo: "What you can do here",
    canDoItems: [
      <>Read — thousands of free horror stories and episode-based series, with a distraction-free reader, adjustable fonts and reading themes.</>,
      <>Write — anyone can <Link to="/become-creator">become a creator</Link>, publish stories in episodes, and build an audience.</>,
      <>Support creators — readers can cheer writers on with likes, ratings and comments, and follow them for new episodes.</>,
      <>Follow — keep up with your favourite storytellers and never miss a new episode.</>,
    ],
    standards: "Our content standards",
    standardsP: (
      <>
        Horror is intense by nature, but Pretika is fiction-first and community-moderated. We do
        not allow hateful content, sexual content involving minors, real-personal-information
        exposure, or content that promotes real-world harm. Readers can report any story or
        comment, and our team reviews reports. See our <Link to="/terms">Terms of Use</Link> for
        the full content policy.
      </>
    ),
    who: "Who runs Pretika?",
    who1: (
      <>
        Pretika is an independent Indian platform built by a small team that grew up trading
        ghost stories after lights-out. Our mission is simple: give Hindi horror — and its
        writers — the home it deserves.
      </>
    ),
    who2: (
      <>
        Questions, feedback or story tips? We would love to hear from you on the{" "}
        <Link to="/contact">contact page</Link>.
      </>
    ),
  },
  hi: {
    title: "प्रेतिका के बारे में",
    subtitle: "रूह कंपा देने वाली हिंदी हॉरर कहानियों का घर — पढ़ो, लिखो और डर महसूस करो।",
    what: "प्रेतिका क्या है?",
    what1: (
      <>
        प्रेतिका एक कहानियों का प्लेटफ़ॉर्म है, जो उस एक चीज़ के लिए बना है जिससे हम सब चुपके-चुपके
        प्यार करते हैं: डर। यहाँ हिंदी, हिंग्लिश और इंग्लिश में लिखी ओरिजिनल हॉरर कहानियाँ
        छपती हैं — भूतों की कहानियाँ, भुतहा हवेलियाँ, अर्बन लीजेंड्स, चुड़ैल और जिन्न के किस्से,
        गाँव का ख़ौफ़ और साइकोलॉजिकल थ्रिलर — जिन्हें भारतीय लेखकों की बढ़ती कम्युनिटी लिखती है।
      </>
    ),
    what2: (
      <>
        प्रेतिका की हर कहानी एक असली इंसान ने लिखी है — उन पाठकों के लिए जो वैसा देसी हॉरर चाहते
        हैं जो बड़े प्लेटफ़ॉर्म कम ही छापते हैं: हमारे अपने कस्बों, रीति-रिवाज़ों, लोककथाओं और
        डरों में रची-बसी कहानियाँ।
      </>
    ),
    canDo: "यहाँ आप क्या कर सकते हैं",
    canDoItems: [
      <>पढ़ें — हज़ारों मुफ़्त हॉरर कहानियाँ और एपिसोड वाली सीरीज़, बिना किसी रुकावट के रीडर,
        अपनी पसंद का फ़ॉन्ट और रीडिंग थीम।</>,
      <>लिखें — कोई भी <Link to="/become-creator">क्रिएटर बन सकता है</Link>, एपिसोड में कहानियाँ
        पब्लिश कर सकता है, और अपने पाठक बना सकता है।</>,
      <>क्रिएटर्स का साथ दें — लाइक, रेटिंग और कमेंट से लेखकों का हौसला बढ़ाएँ, और नए एपिसोड के
        लिए उन्हें फ़ॉलो करें।</>,
      <>फ़ॉलो करें — अपने पसंदीदा कहानीकारों से जुड़े रहें, कोई नया एपिसोड न छूटे।</>,
    ],
    standards: "हमारे कंटेंट के नियम",
    standardsP: (
      <>
        हॉरर होता ही तीखा है, पर प्रेतिका सबसे पहले फ़िक्शन है और इसे कम्युनिटी मिलकर मॉडरेट
        करती है। नफ़रत फैलाने वाला कंटेंट, नाबालिगों से जुड़ा यौन कंटेंट, किसी की प्राइवेट
        जानकारी लीक करना, या असल दुनिया में नुक़सान पहुँचाने वाला कंटेंट यहाँ बिलकुल मना है। पाठक
        किसी भी कहानी या कमेंट को रिपोर्ट कर सकते हैं, और हमारी टीम हर रिपोर्ट देखती है। पूरी
        कंटेंट पॉलिसी के लिए <Link to="/terms">नियम व शर्तें</Link> देखें।
      </>
    ),
    who: "प्रेतिका कौन चलाता है?",
    who1: (
      <>
        प्रेतिका एक इंडिपेंडेंट भारतीय प्लेटफ़ॉर्म है, जिसे एक छोटी सी टीम ने बनाया है — वही टीम जो
        बचपन में बत्ती बुझते ही भूतों की कहानियाँ सुनाया करती थी। हमारा मक़सद सीधा है: हिंदी हॉरर
        — और उसके लेखकों — को वो घर देना जिसके वे हक़दार हैं।
      </>
    ),
    who2: (
      <>
        कोई सवाल, सुझाव या कहानी की टिप? हमें <Link to="/contact">संपर्क पेज</Link> पर ज़रूर लिखें।
      </>
    ),
  },
};

export default function About() {
  const { i18n } = useTranslation();
  const c = COPY[i18n.language === "hi" ? "hi" : "en"];
  return (
    <StaticPage
      title={c.title}
      subtitle={c.subtitle}
      path="/about"
      seoTitle="About Pretika"
      description="Pretika is a Hindi horror-story platform where readers discover spine-chilling bhootiya kahaniyan and writers publish their own horror stories."
    >
      <Section title={c.what}>
        <p>{c.what1}</p>
        <p>{c.what2}</p>
      </Section>

      <Section title={c.canDo}>
        <Ul items={c.canDoItems} />
      </Section>

      <Section title={c.standards}>
        <p>{c.standardsP}</p>
      </Section>

      <Section title={c.who}>
        <p>{c.who1}</p>
        <p>{c.who2}</p>
      </Section>
    </StaticPage>
  );
}
