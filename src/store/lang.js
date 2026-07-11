import { create } from "zustand";
import { applyLanguage, currentLangCode } from "../i18n";
import { STORAGE } from "../lib/constants";
import { api } from "../lib/api";

export const useLang = create((set) => ({
  // Full content-language word ('english' | 'hindi' | 'hinglish') — this exact
  // value goes to the API (register preferred_language, story defaults).
  lang: currentLangCode(),
  // Once any language is picked (popup, navbar, or restored from the account)
  // the first-visit popup never shows again on this device.
  chosen: !!localStorage.getItem(STORAGE.langChosen),
  setLang: (word, { mark = true, sync = true } = {}) => {
    applyLanguage(word);
    if (mark) localStorage.setItem(STORAGE.langChosen, "1");
    set((s) => ({ lang: word, chosen: mark || s.chosen }));
    // Keep the account's preferred_language in sync (fire-and-forget).
    if (sync && localStorage.getItem(STORAGE.token)) {
      api.put("/users/me", { preferred_language: word }).catch(() => {});
    }
  },
}));
