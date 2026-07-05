/**
 * Email Package - Dummy Email Service for Development
 *
 * This package provides a mock email service for development and testing.
 * In production, replace with SendGrid, AWS SES, or similar.
 *
 * Current Behavior:
 * - Logs emails to console with full details
 * - Saves emails to ./emails/ directory (JSON format)
 * - Returns mock messageId for tracking
 *
 * Usage:
 * ```ts
 * import { EmailService } from '@rocky/email';
 *
 * const emailService = new EmailService();
 *
 * await emailService.send({
 *   to: [{ email: 'user@example.com', name: 'John Doe' }],
 *   from: { email: 'noreply@rocky.gov.mk', name: 'Rocky AIMCS' },
 *   subject: 'Test Email',
 *   text: 'This is a test email'
 * });
 * ```
 *
 * TODO: Replace with real provider
 * 1. Install @sendgrid/mail or @aws-sdk/client-ses
 * 2. Update email.service.ts to use real API
 * 3. Remove console logging and file saving
 * 4. Update notification-worker.service.ts to use new implementation
 */

export { EmailService } from "./services/email.service.js";
export * from "./types/email.types.js";
export * from "./templates/index.js";
