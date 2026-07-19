/**
 * @rocky/email — email transport + React Email template rendering.
 *
 * Provides a framework-agnostic `EmailService` (Nodemailer transport with an
 * env-driven SMTP config and a dev fallback), React Email `.tsx` templates, a
 * standalone `renderReactEmail` helper, and a NestJS `EmailModule` for DI in apps/api.
 */

export {
  EmailService,
  renderReactEmail,
  type EmailServiceOptions,
  type SmtpConfig,
} from "./services/email.service.js";
export { EmailModule } from "./email.module.js";
export { PasswordResetEmail, type PasswordResetEmailProps } from "./templates/react/index.js";
export * from "./types/email.types.js";
export * from "./templates/index.js";
