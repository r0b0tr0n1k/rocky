import { z } from "zod";
import { emailStatusSchema } from "@rocky/validators/enums";

// ============================================================================
// Email Types
// ============================================================================

export const emailAddressSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
});

export type EmailAddress = z.infer<typeof emailAddressSchema>;

export const emailAttachmentSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  content: z.union([z.string(), z.instanceof(Buffer)]),
});

export type EmailAttachment = z.infer<typeof emailAttachmentSchema>;

export const sendEmailSchema = z.object({
  // Recipients
  to: z.array(emailAddressSchema).min(1),
  cc: z.array(emailAddressSchema).optional(),
  bcc: z.array(emailAddressSchema).optional(),

  // Sender
  from: emailAddressSchema,
  replyTo: emailAddressSchema.optional(),

  // Content
  subject: z.string(),
  text: z.string(),
  html: z.string().optional(),

  // Attachments
  attachments: z.array(emailAttachmentSchema).optional(),

  // Metadata
  tag: z.string().optional(),
  templateId: z.string().optional(),
  dynamicTemplateData: z.record(z.string(), z.unknown()).optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;

// ============================================================================
// Email Response
// ============================================================================

export const emailResponseSchema = z.object({
  messageId: z.string(),
  status: emailStatusSchema,
  to: z.array(z.string()),
  subject: z.string(),
  timestamp: z.string(),
});

export type EmailResponse = z.infer<typeof emailResponseSchema>;

// ============================================================================
// Batch Email
// ============================================================================

export const sendBatchEmailsSchema = z.object({
  emails: z.array(
    sendEmailSchema.omit({ to: true }).extend({
      to: emailAddressSchema,
    }),
  ),
});

export type SendBatchEmailsInput = z.infer<typeof sendBatchEmailsSchema>;
