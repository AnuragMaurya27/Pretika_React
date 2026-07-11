import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StaticPage, { Section, Ul } from "../components/StaticPage";

/* Terms copy in both UI languages — picked live by i18n.language.
   The English text is the canonical version; the Hindi text is a translation. */
const COPY = {
  en: {
    title: "Terms of Use",
    subtitle: "The ground rules for reading, writing and haunting responsibly on Pretika.",
    sections: [
      {
        h: "1. Acceptance of terms",
        body: [
          <p key="1">
            These Terms of Use govern your access to <strong>pretika.in</strong> (&quot;Pretika&quot;,
            &quot;the service&quot;). By browsing, reading, or creating an account you agree to these terms
            and to our <Link to="/privacy">Privacy Policy</Link>. If you do not agree, please do not
            use the service.
          </p>,
        ],
      },
      {
        h: "2. Eligibility & content warning",
        body: [
          <p key="1">
            Pretika publishes horror fiction that can be intense, frightening or disturbing. The
            service is intended for users aged 13 and above; reader discretion is advised. Stories
            on Pretika are works of fiction — any resemblance to real persons or events is
            coincidental unless stated by the author.
          </p>,
        ],
      },
      {
        h: "3. Your account",
        body: [
          <p key="1">
            You are responsible for your account and everything that happens under it. Keep your
            password safe, provide accurate information, and do not impersonate others or create
            accounts for abusive purposes. We may suspend accounts that violate these terms.
          </p>,
        ],
      },
      {
        h: "4. Your content",
        body: [
          <p key="1">
            Writers keep full ownership of the stories they publish on Pretika. By publishing, you
            grant Pretika a non-exclusive, worldwide licence to host, display, distribute and
            promote your content on the service (including previews and social sharing). You can
            delete your content at any time, which ends this licence except for cached copies.
          </p>,
          <p key="2">You promise that content you publish:</p>,
          <Ul key="3" items={[
            "is your own original work, or you have the rights to publish it;",
            "does not contain hate speech, harassment, or threats against real people;",
            "does not contain sexual content involving minors — zero tolerance, reported to authorities;",
            "does not reveal someone's private information or promote real-world violence or illegal acts;",
            "is not spam, scraped, or plagiarised content.",
          ]} />,
          <p key="4">We may remove content or restrict accounts that break these rules.</p>,
        ],
      },
      {
        h: "5. Free to read",
        body: [
          <p key="1">
            Reading on Pretika is free. We do not sell virtual currency or paid unlocks; the service
            is supported by advertising (see below). If we ever introduce paid features, these terms
            will be updated first.
          </p>,
        ],
      },
      {
        h: "6. Copyright complaints",
        body: [
          <p key="1">
            We respect intellectual property. If you believe content on Pretika infringes your
            copyright, send a takedown request via the <Link to="/contact">contact page</Link> with
            (a) the link to the infringing content, (b) proof of your ownership, and (c) your
            contact details. We review complaints promptly and remove infringing content. Repeat
            infringers lose their accounts.
          </p>,
        ],
      },
      {
        h: "7. Advertising",
        body: [
          <p key="1">
            Pretika may display third-party advertisements (for example via Google AdSense) to keep
            the service free. Advertisers are responsible for their own content; a listing on
            Pretika is not an endorsement. See the <Link to="/privacy">Privacy Policy</Link> for how
            advertising cookies work and how to opt out of personalisation.
          </p>,
        ],
      },
      {
        h: "8. Disclaimers & limitation of liability",
        body: [
          <p key="1">
            The service is provided &quot;as is&quot; without warranties of any kind. Stories are the views
            of their authors, not of Pretika. To the maximum extent permitted by law, Pretika is not
            liable for indirect or consequential damages arising from your use of the service; our
            total liability is limited to the amount you paid us in the previous 12 months.
          </p>,
        ],
      },
      {
        h: "9. Governing law",
        body: [
          <p key="1">
            These terms are governed by the laws of India, and disputes are subject to the exclusive
            jurisdiction of the courts of India.
          </p>,
        ],
      },
      {
        h: "10. Changes",
        body: [
          <p key="1">
            We may update these terms as the service evolves; the date above reflects the latest
            version. Continued use after changes means you accept the updated terms. Questions?{" "}
            <Link to="/contact">Contact us</Link>.
          </p>,
        ],
      },
    ],
  },
  hi: {
    title: "उपयोग की शर्तें",
    subtitle: "प्रेतिका पर ज़िम्मेदारी से पढ़ने, लिखने और डराने के बुनियादी नियम।",
    sections: [
      {
        h: "1. शर्तों की स्वीकृति",
        body: [
          <p key="1">
            ये उपयोग की शर्तें <strong>pretika.in</strong> (&quot;प्रेतिका&quot;, &quot;सर्विस&quot;) तक आपकी
            पहुँच पर लागू होती हैं। साइट ब्राउज़ करने, पढ़ने या अकाउंट बनाने से आप इन शर्तों और हमारी{" "}
            <Link to="/privacy">प्राइवेसी पॉलिसी</Link> से सहमत होते हैं। सहमत नहीं हैं, तो कृपया
            सर्विस इस्तेमाल न करें।
          </p>,
        ],
      },
      {
        h: "2. पात्रता और कंटेंट चेतावनी",
        body: [
          <p key="1">
            प्रेतिका पर छपने वाला हॉरर फ़िक्शन तीव्र, डरावना या विचलित करने वाला हो सकता है। सर्विस
            13 साल और उससे ऊपर के उपयोगकर्ताओं के लिए है; पाठक अपने विवेक से पढ़ें। प्रेतिका की
            कहानियाँ काल्पनिक हैं — किसी असली व्यक्ति या घटना से समानता संयोग है, जब तक लेखक ने
            अलग से न कहा हो।
          </p>,
        ],
      },
      {
        h: "3. आपका अकाउंट",
        body: [
          <p key="1">
            अपने अकाउंट और उसके तहत होने वाली हर गतिविधि की ज़िम्मेदारी आपकी है। पासवर्ड सुरक्षित
            रखें, सही जानकारी दें, और किसी और के नाम से अकाउंट न बनाएँ या दुरुपयोग के लिए अकाउंट न
            बनाएँ। शर्तें तोड़ने वाले अकाउंट हम सस्पेंड कर सकते हैं।
          </p>,
        ],
      },
      {
        h: "4. आपका कंटेंट",
        body: [
          <p key="1">
            प्रेतिका पर पब्लिश की गई कहानियों का पूरा स्वामित्व लेखकों के पास रहता है। पब्लिश करके
            आप प्रेतिका को अपने कंटेंट को सर्विस पर होस्ट, दिखाने, वितरित और प्रमोट करने (प्रीव्यू
            और सोशल शेयरिंग समेत) का नॉन-एक्सक्लूसिव, विश्वव्यापी लाइसेंस देते हैं। आप कभी भी अपना
            कंटेंट डिलीट कर सकते हैं — इससे यह लाइसेंस ख़त्म हो जाता है (कैश की गई कॉपियों को छोड़कर)।
          </p>,
          <p key="2">आप वादा करते हैं कि आपका पब्लिश किया कंटेंट:</p>,
          <Ul key="3" items={[
            "आपकी अपनी मौलिक रचना है, या आपके पास उसे पब्लिश करने के अधिकार हैं;",
            "उसमें नफ़रत भरी बातें, उत्पीड़न, या असली लोगों को धमकियाँ नहीं हैं;",
            "उसमें नाबालिगों से जुड़ा यौन कंटेंट नहीं है — ज़ीरो टॉलरेंस, अधिकारियों को रिपोर्ट किया जाएगा;",
            "किसी की निजी जानकारी उजागर नहीं करता और असल दुनिया में हिंसा या ग़ैरक़ानूनी कामों को बढ़ावा नहीं देता;",
            "स्पैम, कहीं से उठाया (स्क्रैप किया) या चोरी (कॉपी) किया कंटेंट नहीं है।",
          ]} />,
          <p key="4">नियम तोड़ने वाला कंटेंट हम हटा सकते हैं या अकाउंट सीमित कर सकते हैं।</p>,
        ],
      },
      {
        h: "5. पढ़ना मुफ़्त है",
        body: [
          <p key="1">
            प्रेतिका पर पढ़ना मुफ़्त है। हम वर्चुअल करेंसी या पेड अनलॉक नहीं बेचते; सर्विस विज्ञापन
            से चलती है (नीचे देखें)। अगर हम कभी पेड फ़ीचर लाए, तो पहले ये शर्तें अपडेट होंगी।
          </p>,
        ],
      },
      {
        h: "6. कॉपीराइट शिकायतें",
        body: [
          <p key="1">
            हम बौद्धिक संपदा का सम्मान करते हैं। अगर आपको लगता है कि प्रेतिका पर कोई कंटेंट आपके
            कॉपीराइट का उल्लंघन करता है, तो <Link to="/contact">संपर्क पेज</Link> से टेकडाउन अनुरोध
            भेजें — (क) उल्लंघन करने वाले कंटेंट का लिंक, (ख) आपके स्वामित्व का प्रमाण, और (ग) आपकी
            संपर्क जानकारी के साथ। हम शिकायतें जल्दी जाँचते हैं और उल्लंघन करने वाला कंटेंट हटाते
            हैं। बार-बार उल्लंघन करने वालों के अकाउंट बंद हो जाते हैं।
          </p>,
        ],
      },
      {
        h: "7. विज्ञापन",
        body: [
          <p key="1">
            सर्विस को मुफ़्त रखने के लिए प्रेतिका थर्ड-पार्टी विज्ञापन दिखा सकती है (जैसे Google
            AdSense से)। विज्ञापनदाता अपने कंटेंट के लिए ख़ुद ज़िम्मेदार हैं; प्रेतिका पर दिखना कोई
            समर्थन नहीं है। विज्ञापन कुकीज़ कैसे काम करती हैं और पर्सनलाइज़ेशन से कैसे बाहर निकलें,
            इसके लिए <Link to="/privacy">प्राइवेसी पॉलिसी</Link> देखें।
          </p>,
        ],
      },
      {
        h: "8. अस्वीकरण और देयता की सीमा",
        body: [
          <p key="1">
            सर्विस &quot;जैसी है&quot; उपलब्ध है, बिना किसी वारंटी के। कहानियाँ उनके लेखकों के विचार हैं,
            प्रेतिका के नहीं। क़ानून द्वारा अनुमत अधिकतम सीमा तक, सर्विस के उपयोग से होने वाले
            अप्रत्यक्ष या परिणामी नुक़सान के लिए प्रेतिका ज़िम्मेदार नहीं है; हमारी कुल देयता पिछले
            12 महीनों में आपके द्वारा हमें दी गई राशि तक सीमित है।
          </p>,
        ],
      },
      {
        h: "9. लागू क़ानून",
        body: [
          <p key="1">
            ये शर्तें भारत के क़ानूनों से शासित हैं, और विवाद भारत की अदालतों के विशेष क्षेत्राधिकार
            के अधीन होंगे।
          </p>,
        ],
      },
      {
        h: "10. बदलाव",
        body: [
          <p key="1">
            सर्विस के विकास के साथ हम ये शर्तें अपडेट कर सकते हैं; ऊपर दी गई तारीख़ नवीनतम संस्करण
            दिखाती है। बदलावों के बाद इस्तेमाल जारी रखने का मतलब है कि आप अपडेटेड शर्तें स्वीकार
            करते हैं। कोई सवाल? <Link to="/contact">हमसे संपर्क करें</Link>।
          </p>,
        ],
      },
    ],
  },
};

export default function Terms() {
  const { i18n } = useTranslation();
  const c = COPY[i18n.language === "hi" ? "hi" : "en"];
  return (
    <StaticPage
      title={c.title}
      subtitle={c.subtitle}
      path="/terms"
      seoTitle="Terms of Use"
      description="Pretika's terms of use — accounts, user-generated content, content policy, copyright complaints and disclaimers."
      updated="July 4, 2026"
    >
      {c.sections.map((s) => (
        <Section key={s.h} title={s.h}>{s.body}</Section>
      ))}
    </StaticPage>
  );
}
