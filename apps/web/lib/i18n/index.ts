"use client";

// ── i18n layer (WO-086) ──
// Thin, dependency-free translation helper. Consumes the locale resolved from
// the Better Auth session (`session.user.language`, MK default) and looks strings
// up in the centralized catalog (./messages). Designed as the seam where a full
// i18n framework (next-intl) can be dropped in later without touching call sites:
// components call `useT()` / `t(key)` and the provider owns the active locale.
//
// NOTE: this module is intentionally JSX-free (uses React.createElement) and is a
// .ts file so it is importable by both the Next.js app and the vitest suite
// without a .tsx JSX transform under Vite's `jsx: preserve` tsconfig setting.

import { createContext, createElement, type ReactNode, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, type Locale, normalizeLocale } from "./dir";
import { MESSAGES } from "./messages";

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

function makeTranslate(locale: Locale): TranslateFn {
  const dict = MESSAGES[locale];
  const fallback = MESSAGES[DEFAULT_LOCALE];
  return (key, vars) => {
    const raw = dict[key] ?? fallback[key] ?? key;
    return interpolate(raw, vars);
  };
}

interface I18nContextValue {
  locale: Locale;
  t: TranslateFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  locale?: Locale;
  children: ReactNode;
}

export function I18nProvider({ locale, children }: I18nProviderProps) {
  const resolved = normalizeLocale(locale);
  const value = useMemo<I18nContextValue>(() => ({ locale: resolved, t: makeTranslate(resolved) }), [resolved]);
  return createElement(I18nContext.Provider, { value }, children);
}

/** Hook for components inside <I18nProvider>. Falls back to MK if no provider. */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return { locale: DEFAULT_LOCALE, t: makeTranslate(DEFAULT_LOCALE) };
}

export function useT(): TranslateFn {
  return useI18n().t;
}

/** Non-hook accessor for use in module scope where a provider may not be mounted. */
export function translateFor(locale: Locale): TranslateFn {
  return makeTranslate(normalizeLocale(locale));
}
