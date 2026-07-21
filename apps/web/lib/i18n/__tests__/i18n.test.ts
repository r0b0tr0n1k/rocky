import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, dirFor, htmlLang, normalizeLocale } from "../dir.js";
import { translateFor } from "../index.js";
import { MESSAGES } from "../messages.js";

describe("i18n layer (WO-086)", () => {
  it("normalizes unknown locales to the MK default", () => {
    expect(normalizeLocale("xx")).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale("en")).toBe("EN");
    expect(normalizeLocale("mk")).toBe("MK");
  });

  it("maps locale to html lang + LTR direction (RTL-ready)", () => {
    expect(dirFor("MK")).toBe("ltr");
    expect(dirFor("EN")).toBe("ltr");
    expect(htmlLang("MK")).toBe("mk");
  });

  it("centralizes nav strings and falls back to MK then the raw key", () => {
    expect(translateFor("MK")("nav.animals")).toBe("Животни");
    expect(translateFor("EN")("nav.animals")).toBe("Animals");
    // missing key → raw key
    expect(translateFor("EN")("nav.does.not.exist")).toBe("nav.does.not.exist");
  });

  it("every locale covers the same keys", () => {
    const keys = Object.keys(MESSAGES.EN).sort();
    for (const locale of Object.keys(MESSAGES) as Array<keyof typeof MESSAGES>) {
      expect(Object.keys(MESSAGES[locale]).sort()).toEqual(keys);
    }
  });
});
