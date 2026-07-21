// ── Mobile i18n layer (WO-086) ──
// i18next-backed translation helper for the Expo app. Mirrors the web layer's
// shape (default locale "MK", supported MK/EN) but uses i18next + react-i18next
// (plan OQ-3). Wires the locale catalog and exposes a thin `t` + locale API so
// screens can localize without pulling i18next internals into every component.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import mk from "./locales/mk.json";
import en from "./locales/en.json";

export const SUPPORTED_LOCALES = ["MK", "EN", "AL"] as const;
export type MobileLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: MobileLocale = "MK";

const resources = {
  MK: { translation: mk },
  EN: { translation: en },
  AL: { translation: en },
} as const;

export const i18nInstance = i18n.createInstance();

void i18nInstance.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

/** Translate a key with optional interpolation vars. */
export function t(key: string, vars?: Record<string, string | number>): string {
  return i18nInstance.t(key, vars);
}

export function getLocale(): MobileLocale {
  const lng = i18nInstance.language.toUpperCase();
  return (SUPPORTED_LOCALES as readonly string[]).includes(lng) ? (lng as MobileLocale) : DEFAULT_LOCALE;
}

export async function changeLanguage(locale: MobileLocale): Promise<void> {
  await i18nInstance.changeLanguage(locale);
}

export default i18nInstance;
