// ── Locale → direction (WO-086) ──
// Centralized locale utilities. The backend already resolves locale via
// RuntimeBuilder (Accept-Language ?? principal locale claim ?? "MK") and better-auth
// enriches it onto the session, but the frontend ignores it. This module is the
// single source of truth for: which locales we support, the default, and the
// text direction (RTL-ready — current MK/EN/AL are LTR, but sq/ar would flip).

export type Locale = "MK" | "EN" | "AL";

export const SUPPORTED_LOCALES: Locale[] = ["MK", "EN", "AL"];
export const DEFAULT_LOCALE: Locale = "MK";

/** Locales rendered right-to-left. Empty today, but keeps the shell RTL-ready. */
const RTL_LOCALES = new Set<Locale>([]);

export function normalizeLocale(input: unknown): Locale {
  if (typeof input === "string" && (SUPPORTED_LOCALES as string[]).includes(input.toUpperCase())) {
    return input.toUpperCase() as Locale;
  }
  return DEFAULT_LOCALE;
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}

export function htmlLang(locale: Locale): string {
  // BCP-47-ish lowercased subtags for <html lang>
  return locale.toLowerCase();
}
