import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ptBR from "../locales/pt-BR/translation.json";
import enUS from "../locales/en-US/translation.json";

import { safeStorage } from "../services/storage/storage";

const LANGUAGE_KEY = "ps_language";

const getInitialLanguage = (): string => {
  const saved = safeStorage.getItem(LANGUAGE_KEY);
  if (saved) return saved;
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language.startsWith("pt") ? "pt-BR" : "en-US";
  }
  return "pt-BR";
};

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    "en-US": { translation: enUS },
  },
  lng: getInitialLanguage(),
  fallbackLng: "pt-BR",
  interpolation: {
    // React already protects against XSS
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng: string) => {
  safeStorage.setItem(LANGUAGE_KEY, lng);
});

export default i18n;
