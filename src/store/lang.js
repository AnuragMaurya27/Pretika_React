import { create } from "zustand";
import { applyLanguage, currentLangCode } from "../i18n";

export const useLang = create((set) => ({
  lang: currentLangCode(), // 'english' | 'hindi'
  setLang: (code) => {
    applyLanguage(code);
    set({ lang: code });
  },
}));
