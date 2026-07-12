import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StaticPage, { Section, Ul } from "../components/StaticPage";

/* Policy copy in both UI languages — picked live by i18n.language.
   The English text is the canonical policy; the Hindi text is a translation. */
const COPY = {
  en: {
    title: "Privacy Policy",
    subtitle: "What we collect, why we collect it, and the choices you have.",
    sections: [
      {
        h: "Who we are",
        body: [
          <p key="1">
            Pretika (&quot;we&quot;, &quot;us&quot;) operates <strong>pretika.in</strong>, a platform for reading and
            writing Hindi horror stories. This policy explains what information we collect when you
            use the website and the choices you have. By using Pretika you agree to this policy.
          </p>,
        ],
      },
      {
        h: "Information we collect",
        body: [
          <Ul key="1" items={[
            <><strong>Account information</strong> — when you register we collect your email address, username, display name and password (stored as a secure hash). Adding a bio or avatar is optional.</>,
            <><strong>Content you create</strong> — stories, episodes, comments, ratings, bookmarks and follows are stored so the service can work.</>,
            <><strong>Usage information</strong> — pages visited, stories read and reading progress, so we can resume your reading and recommend stories.</>,
            <><strong>Device information</strong> — standard web logs such as IP address, browser type and screen size, used for security and to keep the site working well on your device.</>,
          ]} />,
          <p key="2">We do not knowingly collect government IDs, precise location, or contact lists.</p>,
        ],
      },
      {
        h: "How we use your information",
        body: [
          <Ul key="1" items={[
            "To provide the service — accounts, publishing and reading progress.",
            "To keep the community safe — moderation of reported content and prevention of abuse or fraud.",
            "To improve Pretika — understanding which stories and features readers enjoy.",
            "To communicate with you — service emails such as password resets. We do not sell your personal information to anyone.",
          ]} />,
        ],
      },
      {
        h: "Cookies & local storage",
        body: [
          <p key="1">
            Pretika uses browser <em>localStorage</em> to keep you signed in (authentication tokens)
            and to remember preferences such as your reading theme, font size and language. Cookies
            and similar technologies may also be set by third-party services described below. You
            can clear these at any time from your browser settings; you may need to sign in again
            afterwards.
          </p>,
        ],
      },
      {
        h: "Advertising (Google AdSense)",
        body: [
          <p key="1">
            We may show advertisements served by Google AdSense and other third-party vendors to
            keep Pretika free. Please note:
          </p>,
          <Ul key="2" items={[
            <>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites.</>,
            <>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the Internet.</>,
            <>You may opt out of personalised advertising by visiting{" "}<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>, or opt out of some third-party vendors' cookies at{" "}<a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.</>,
            <>For more on how Google uses data from sites that use its services, see{" "}<a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">policies.google.com/technologies/partner-sites</a>.</>,
          ]} />,
        ],
      },
      {
        h: "Data retention & security",
        body: [
          <p key="1">
            We keep your account data for as long as your account exists. Published stories and
            comments remain until you delete them or your account. We use industry-standard
            safeguards (encrypted connections, hashed passwords, token-based authentication), but no
            method of transmission over the Internet is 100% secure.
          </p>,
        ],
      },
      {
        h: "Children",
        body: [
          <p key="1">
            Pretika hosts horror fiction and is not directed at children under 13. If you believe a
            child under 13 has created an account, please <Link to="/contact">contact us</Link> and
            we will remove it.
          </p>,
        ],
      },
      {
        h: "Your rights",
        body: [
          <p key="1">
            You can edit your profile at any time from the app. You may also request a copy of your
            data or deletion of your account by writing to us via the{" "}
            <Link to="/contact">contact page</Link>; we respond within 30 days.
          </p>,
        ],
      },
      {
        h: "Changes to this policy",
        body: [
          <p key="1">
            We may update this policy from time to time. Material changes will be announced on the
            site, and the &quot;last updated&quot; date above always reflects the current version.
          </p>,
        ],
      },
    ],
  },
  hi: {
    title: "प्राइवेसी पॉलिसी",
    subtitle: "हम क्या जानकारी लेते हैं, क्यों लेते हैं, और आपके पास क्या ऑप्शन हैं।",
    sections: [
      {
        h: "हम कौन हैं",
        body: [
          <p key="1">
            प्रेतिका (&quot;हम&quot;) <strong>pretika.in</strong> चलाती है — हिंदी हॉरर कहानियाँ पढ़ने और
            लिखने का प्लेटफ़ॉर्म। यह पॉलिसी बताती है कि वेबसाइट इस्तेमाल करते समय हम कौन-सी जानकारी
            इकट्ठा करते हैं और आपके पास क्या विकल्प हैं। प्रेतिका इस्तेमाल करके आप इस पॉलिसी से
            सहमत होते हैं।
          </p>,
        ],
      },
      {
        h: "हम कौन-सी जानकारी इकट्ठा करते हैं",
        body: [
          <Ul key="1" items={[
            <><strong>अकाउंट जानकारी</strong> — रजिस्टर करते समय हम आपका ईमेल, यूज़रनेम, नाम और पासवर्ड (सुरक्षित हैश के रूप में) लेते हैं। बायो या फ़ोटो जोड़ना ज़रूरी नहीं है।</>,
            <><strong>आपका बनाया कंटेंट</strong> — कहानियाँ, एपिसोड, कमेंट, रेटिंग, बुकमार्क और फ़ॉलो — ताकि सर्विस काम कर सके।</>,
            <><strong>उपयोग की जानकारी</strong> — कौन-से पेज देखे, कौन-सी कहानियाँ पढ़ीं और पढ़ने की प्रगति — ताकि आप वहीं से पढ़ना जारी रख सकें और हम कहानियाँ सुझा सकें।</>,
            <><strong>डिवाइस की जानकारी</strong> — सामान्य वेब लॉग जैसे IP पता, ब्राउज़र का प्रकार और स्क्रीन साइज़ — सुरक्षा के लिए और साइट आपके डिवाइस पर ठीक चले, इसके लिए।</>,
          ]} />,
          <p key="2">हम जानबूझकर सरकारी पहचान-पत्र, सटीक लोकेशन या कॉन्टैक्ट लिस्ट इकट्ठा नहीं करते।</p>,
        ],
      },
      {
        h: "हम आपकी जानकारी कैसे इस्तेमाल करते हैं",
        body: [
          <Ul key="1" items={[
            "सर्विस देने के लिए — अकाउंट, पब्लिशिंग और पढ़ने की प्रगति।",
            "समुदाय को सुरक्षित रखने के लिए — रिपोर्ट किए गए कंटेंट का मॉडरेशन और धोखाधड़ी/दुरुपयोग की रोकथाम।",
            "प्रेतिका को बेहतर बनाने के लिए — यह समझना कि पाठकों को कौन-सी कहानियाँ और फ़ीचर पसंद हैं।",
            "आपसे संपर्क के लिए — सर्विस ईमेल जैसे पासवर्ड रीसेट। हम आपकी निजी जानकारी किसी को नहीं बेचते।",
          ]} />,
        ],
      },
      {
        h: "कुकीज़ और लोकल स्टोरेज",
        body: [
          <p key="1">
            प्रेतिका ब्राउज़र <em>localStorage</em> का इस्तेमाल करती है ताकि आप साइन-इन रहें
            (ऑथेंटिकेशन टोकन) और आपकी पसंद याद रहे — जैसे रीडिंग थीम, फ़ॉन्ट साइज़ और भाषा। नीचे
            बताई गई थर्ड-पार्टी सेवाएँ भी कुकीज़ या मिलती-जुलती तकनीकें सेट कर सकती हैं। आप इन्हें
            कभी भी ब्राउज़र सेटिंग से हटा सकते हैं; उसके बाद दोबारा साइन-इन करना पड़ सकता है।
          </p>,
        ],
      },
      {
        h: "विज्ञापन (Google AdSense)",
        body: [
          <p key="1">
            प्रेतिका को मुफ़्त रखने के लिए हम Google AdSense और अन्य थर्ड-पार्टी वेंडर के विज्ञापन
            दिखा सकते हैं। कृपया ध्यान दें:
          </p>,
          <Ul key="2" items={[
            <>Google समेत थर्ड-पार्टी वेंडर आपकी इस और दूसरी वेबसाइटों की पिछली विज़िट के आधार पर विज्ञापन दिखाने के लिए कुकीज़ इस्तेमाल करते हैं।</>,
            <>Google की विज्ञापन कुकीज़ की मदद से वह और उसके पार्टनर आपकी इस साइट और/या इंटरनेट की दूसरी साइटों की विज़िट के आधार पर विज्ञापन दिखा पाते हैं।</>,
            <>पर्सनलाइज़्ड विज्ञापन से बाहर निकलने के लिए{" "}<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a> पर जाएँ, या कुछ थर्ड-पार्टी वेंडर की कुकीज़ से{" "}<a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">www.aboutads.info</a> पर ऑप्ट-आउट करें।</>,
            <>Google अपनी सेवाएँ इस्तेमाल करने वाली साइटों के डेटा का उपयोग कैसे करता है, इसके लिए देखें{" "}<a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">policies.google.com/technologies/partner-sites</a>।</>,
          ]} />,
        ],
      },
      {
        h: "डेटा कब तक रहता है और सुरक्षा",
        body: [
          <p key="1">
            जब तक आपका अकाउंट है, हम आपका अकाउंट डेटा रखते हैं। पब्लिश की गई कहानियाँ और कमेंट तब
            तक रहते हैं जब तक आप उन्हें या अपना अकाउंट डिलीट नहीं करते। हम इंडस्ट्री-स्टैंडर्ड
            सुरक्षा (एन्क्रिप्टेड कनेक्शन, हैश किए पासवर्ड, टोकन वाला ऑथेंटिकेशन) इस्तेमाल करते
            हैं, पर इंटरनेट पर कोई भी तरीक़ा 100% सुरक्षित नहीं होता।
          </p>,
        ],
      },
      {
        h: "बच्चे",
        body: [
          <p key="1">
            प्रेतिका पर हॉरर फ़िक्शन है और यह 13 साल से छोटे बच्चों के लिए नहीं है। अगर आपको लगता है
            कि 13 से छोटे बच्चे ने अकाउंट बनाया है, तो कृपया <Link to="/contact">हमसे संपर्क करें</Link> —
            हम उसे हटा देंगे।
          </p>,
        ],
      },
      {
        h: "आपके अधिकार",
        body: [
          <p key="1">
            आप ऐप से कभी भी अपनी प्रोफ़ाइल एडिट कर सकते हैं। आप अपने डेटा की कॉपी या अकाउंट डिलीट
            करने की माँग भी <Link to="/contact">संपर्क पेज</Link> से कर सकते हैं; हम 30 दिनों के भीतर
            जवाब देते हैं।
          </p>,
        ],
      },
      {
        h: "इस पॉलिसी में बदलाव",
        body: [
          <p key="1">
            हम समय-समय पर यह पॉलिसी अपडेट कर सकते हैं। बड़े बदलावों की घोषणा साइट पर होगी, और ऊपर
            दी गई &quot;आखिरी अपडेट&quot; तारीख़ हमेशा मौजूदा संस्करण दिखाती है।
          </p>,
        ],
      },
    ],
  },
};

export default function Privacy() {
  const { i18n } = useTranslation();
  const c = COPY[i18n.language === "hi" ? "hi" : "en"];
  return (
    <StaticPage
      title={c.title}
      subtitle={c.subtitle}
      path="/privacy"
      seoTitle="Privacy Policy"
      description="Pretika's privacy policy — the data we collect, how cookies and advertising (including Google AdSense) work on the site, and your rights."
      updated="July 4, 2026"
    >
      {c.sections.map((s) => (
        <Section key={s.h} title={s.h}>{s.body}</Section>
      ))}
    </StaticPage>
  );
}
