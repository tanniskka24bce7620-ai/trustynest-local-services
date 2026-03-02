import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import te from "@/locales/te.json";
import ta from "@/locales/ta.json";
import kn from "@/locales/kn.json";
import ml from "@/locales/ml.json";
import bn from "@/locales/bn.json";
import od from "@/locales/od.json";
import mr from "@/locales/mr.json";
import gu from "@/locales/gu.json";
import ur from "@/locales/ur.json";
import as_ from "@/locales/as.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", dir: "ltr" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", dir: "ltr" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", dir: "ltr" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ", dir: "ltr" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം", dir: "ltr" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", dir: "ltr" },
  { code: "od", label: "Odia", nativeLabel: "ଓଡ଼ିଆ", dir: "ltr" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", dir: "ltr" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી", dir: "ltr" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", dir: "rtl" },
  { code: "as", label: "Assamese", nativeLabel: "অসমীয়া", dir: "ltr" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      te: { translation: te },
      ta: { translation: ta },
      kn: { translation: kn },
      ml: { translation: ml },
      bn: { translation: bn },
      od: { translation: od },
      mr: { translation: mr },
      gu: { translation: gu },
      ur: { translation: ur },
      as: { translation: as_ },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
