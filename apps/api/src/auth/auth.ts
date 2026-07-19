// -- Auth Configuration & Instance --
// Provides auth config to AuthModule.register() and the auth instance
// to @thallesp/nestjs-better-auth's AuthModule.forRoot().
//
// SINGLE INSTANCE: Auth.getInstance() is idempotent - calling it multiple
// times with the same config returns the same singleton.

import { Auth, type AuthConfig } from "@rocky/auth";
import { EmailService, PasswordResetEmail, renderReactEmail } from "@rocky/email";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET environment variable is not set");
}

const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",")
  : ["http://localhost:4000", "mobile://"];

// Shared parent cookie domain for cross-subdomain sessions. Defaults to the
// Rocky root domain (`.${ROCKY_DOMAIN}`) so `api.`, `admin.`, `docs.` subdomains
// share the Better Auth session cookie. Override with AUTH_COOKIE_DOMAIN when the
// app lives under a deeper tertiary domain (e.g. `.rocky.company.com`).
const cookieDomain =
  process.env.AUTH_COOKIE_DOMAIN ??
  (process.env.ROCKY_DOMAIN ? `.${process.env.ROCKY_DOMAIN}` : undefined);

// Password-reset email delivery via @rocky/email (Nodemailer + React Email).
// Reads SMTP_* / MAIL_FROM from env; when unset it falls back to a dev no-send
// log so local dev needs no mail server.
const emailService = new EmailService();

export const authConfig: AuthConfig = {
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.BASE_SERVICE_URL ?? "http://localhost:8080",
  secret,
  trustedOrigins,
  cookieDomain,
  sendResetPassword: async ({ user, url }) => {
    await emailService.send({
      to: [{ email: user.email, name: user.name }],
      from: { email: process.env.MAIL_FROM ?? "noreply@rocky.gov.mk" },
      subject: "Reset your Rocky password",
      text: `Reset your password: ${url}`,
      html: await renderReactEmail(PasswordResetEmail, { url, name: user.name, locale: "EN" }),
    });
  },
};

// Create the singleton instance - Auth.getInstance() is idempotent
export const auth = Auth.getInstance(authConfig);
