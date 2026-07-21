import { beforeAll, describe, expect, it } from "vitest";
import { i18nInstance, t, getLocale, changeLanguage, DEFAULT_LOCALE } from "../index";

describe("mobile i18n layer (WO-086)", () => {
  beforeAll(async () => {
    // ensure instance is initialized before assertions
    await i18nInstance.isInitialized;
  });

  it("defaults to the MK locale", () => {
    expect(DEFAULT_LOCALE).toBe("MK");
  });

  it("returns the EN value when language is en", async () => {
    await changeLanguage("EN");
    expect(t("auth.signIn")).toBe("Sign in");
    expect(getLocale()).toBe("EN");
  });

  it("falls back to MK when language is mk", async () => {
    await changeLanguage("MK");
    expect(t("auth.signIn")).toBe("Најави се");
    expect(getLocale()).toBe("MK");
  });
});
