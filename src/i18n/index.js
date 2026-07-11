import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import hi from "./hi";
import { STORAGE } from "../lib/constants";

// The UI runs in two languages (en / hi). localStorage keeps the full
// content-language word ('hindi' / 'english' / 'hinglish' — never the i18n
// codes, the API 500s on those); i18next runs on 'hi' / 'en'. Hinglish content
// is Latin-script, so it maps to the English UI.
export const uiCode = (word) => (word === "hindi" ? "hi" : "en");

function storedLang() {
  const w = localStorage.getItem(STORAGE.lang);
  return w === "hindi" || w === "english" || w === "hinglish" ? w : "english";
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: uiCode(storedLang()),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

/** Content-language word ('hindi'|'english'|'hinglish') currently in effect. */
export function currentLangCode() {
  return storedLang();
}

/** Apply a content-language word to the whole UI + persist it. */
export function applyLanguage(word) {
  localStorage.setItem(STORAGE.lang, word);
  const code = uiCode(word);
  if (i18n.language !== code) i18n.changeLanguage(code);
  document.documentElement.lang = code;
}

document.documentElement.lang = uiCode(storedLang());

export default i18n;
