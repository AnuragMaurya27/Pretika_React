import i18n from "../i18n";

/**
 * Display-only Hindi names for the API categories. Filtering & navigation
 * always use the category SLUG (never touched here) — this maps what the
 * user *sees*. Stories only carry `category_name`, so we key by both slug
 * and English name. Unknown categories fall back to the API name.
 */
const HI_BY_SLUG = {
  "ghost-stories": "भूतिया कहानियाँ",
  "haunted-places": "भुतहा जगहें",
  "urban-legends": "अर्बन लीजेंड्स",
  "real-experiences": "सच्चे अनुभव",
  "paranormal": "पैरानॉर्मल",
  "jinn-spirits": "जिन्न और रूहें",
  "village-horror": "गाँव का ख़ौफ़",
  "tantrik-black-magic": "तंत्र और काला जादू",
  "psychological-horror": "साइकोलॉजिकल हॉरर",
  "mythology-horror": "पौराणिक हॉरर",
  "scifi-horror": "साई-फ़ाई हॉरर",
  "horror-poetry": "डरावनी कविताएँ",
  "creepypasta": "क्रीपीपास्ता",
  "serial-horror": "सीरियल हॉरर",
  "micro-horror": "माइक्रो हॉरर",
  "fruits": "फल",
  "yakshini-stories": "यक्षिणी कहानियाँ",
};

const HI_BY_NAME = {
  "Ghost Stories": HI_BY_SLUG["ghost-stories"],
  "Haunted Places": HI_BY_SLUG["haunted-places"],
  "Urban Legends": HI_BY_SLUG["urban-legends"],
  "Real Experiences": HI_BY_SLUG["real-experiences"],
  "Paranormal": HI_BY_SLUG["paranormal"],
  "Jinn & Spirits": HI_BY_SLUG["jinn-spirits"],
  "Village Horror": HI_BY_SLUG["village-horror"],
  "Tantrik & Black Magic": HI_BY_SLUG["tantrik-black-magic"],
  "Psychological Horror": HI_BY_SLUG["psychological-horror"],
  "Mythology Horror": HI_BY_SLUG["mythology-horror"],
  "Sci-Fi Horror": HI_BY_SLUG["scifi-horror"],
  "Horror Poetry": HI_BY_SLUG["horror-poetry"],
  "Creepypasta": HI_BY_SLUG["creepypasta"],
  "Serial Horror": HI_BY_SLUG["serial-horror"],
  "Micro Horror": HI_BY_SLUG["micro-horror"],
  "Fruits": HI_BY_SLUG["fruits"],
  "Yakshini Stories": HI_BY_SLUG["yakshini-stories"],
};

/** Localized display name for a category object ({name, slug}) or a bare name string. */
export function categoryLabel(cat) {
  const name = typeof cat === "string" ? cat : cat?.name;
  if (i18n.language !== "hi" || !name) return name;
  const slug = typeof cat === "object" ? cat?.slug : null;
  return (slug && HI_BY_SLUG[slug]) || HI_BY_NAME[name] || name;
}
