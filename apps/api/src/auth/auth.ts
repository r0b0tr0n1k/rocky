// -- Auth Configuration & Instance --
// Provides auth config to AuthModule.register() and the auth instance
// to @thallesp/nestjs-better-auth's AuthModule.forRoot().
//
// SINGLE INSTANCE: Auth.getInstance() is idempotent - calling it multiple
// times with the same config returns the same singleton.

import { Auth, type AuthConfig } from "@rocky/auth";
import { createPinoLogger } from "@rocky/logger";
import { EmailService, PasswordResetEmail, VerificationEmail, DuplicateSignupEmail, renderReactEmail } from "@rocky/email";

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
  process.env.AUTH_COOKIE_DOMAIN ?? (process.env.ROCKY_DOMAIN ? `.${process.env.ROCKY_DOMAIN}` : undefined);

// ── Session policy (Decision A/B/C) ──
// Lifetime 7d (sliding 1d); freshness window 15min for step-up on privileged
// mutations; compact cookie cache 300s (mirrors 5-min PrincipalCache TTL).
const sessionLifetimeSeconds = Number(process.env.SESSION_LIFETIME_SECONDS ?? 60 * 60 * 24 * 7);
const sessionFreshAgeSeconds = Number(process.env.SESSION_FRESH_AGE_SECONDS ?? 60 * 15);
const cookieCacheMaxAgeSeconds = Number(process.env.COOKIE_CACHE_MAX_AGE_SECONDS ?? 300);

// Password-reset email delivery via @rocky/email (Nodemailer + React Email).
// Reads SMTP_* / MAIL_FROM from env; when unset it falls back to a dev no-send
// log so local dev needs no mail server.
const emailService = new EmailService();
const logger = createPinoLogger();

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
  sendVerificationEmail: async ({ user, url }) => {
    await emailService.send({
      to: [{ email: user.email, name: user.name }],
      from: { email: process.env.MAIL_FROM ?? "noreply@rocky.gov.mk" },
      subject: "Verify your Rocky account",
      text: `Verify your email: ${url}`,
      html: await renderReactEmail(VerificationEmail, { url, name: user.name, locale: "EN" }),
    });
  },
  afterEmailVerification: async (user) => {
    logger.log({ event: "email_verified", userId: user.id, email: user.email });
  },
  onExistingUserSignUp: async ({ user }) => {
    await emailService.send({
      to: [{ email: user.email, name: user.name }],
      from: { email: process.env.MAIL_FROM ?? "noreply@rocky.gov.mk" },
      subject: "Security alert: someone tried to sign up with your email",
      text: `We received a sign-up request using your email (${user.email}). If this was you, no action is needed. If not, your account is safe.`,
      html: await renderReactEmail(DuplicateSignupEmail, { email: user.email, name: user.name, locale: "EN" }),
    });
  },
  session: {
    expiresIn: sessionLifetimeSeconds,
    updateAge: 60 * 60 * 24,
    freshAge: sessionFreshAgeSeconds,
    cookieCache: {
      enabled: true,
      maxAge: cookieCacheMaxAgeSeconds,
      strategy: "compact",
    },
  },
};

// Create the singleton instance - Auth.getInstance() is idempotent
export const auth = Auth.getInstance(authConfig);
