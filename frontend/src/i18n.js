import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";
import gu from "./locales/gu.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";
import kn from "./locales/kn.json";
import ml from "./locales/ml.json";
import bn from "./locales/bn.json";
import pa from "./locales/pa.json";
import orIN from "./locales/or.json";
import asIN from "./locales/as.json";
import ur from "./locales/ur.json";

const savedLang = (() => {
  try { return localStorage.getItem("teknode_lang") || null; } catch { return null; }
})();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      gu: { translation: gu },
      ta: { translation: ta },
      te: { translation: te },
      kn: { translation: kn },
      ml: { translation: ml },
      bn: { translation: bn },
      pa: { translation: pa },
      or: { translation: orIN },
      as: { translation: asIN },
      ur: { translation: ur },
    },
    lng: savedLang || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "teknode_lang",
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
