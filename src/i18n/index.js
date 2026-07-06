import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import hi from "./hi";
import { STORAGE } from "../lib/constants";

// The UI is English-only now — language selection has been removed.
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// Content-language enum used when creating stories / registering. Always english
// now (there is no language switcher); kept so the lang store has a stable value.
export function currentLangCode() {
  return "english";
}

// No-op kept for API compatibility with the (now switcher-less) lang store.
export function applyLanguage(code) {
  localStorage.setItem(STORAGE.lang, code);
}

document.documentElement.lang = "en";

export default i18n;
