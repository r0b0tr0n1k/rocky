import { createTransport, type SentMessageInfo, type Transporter, type TransportOptions } from "nodemailer";
import { render } from "@react-email/render";
import { createElement, type ComponentType, type ReactElement } from "react";
import { writeFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Injectable } from "@nestjs/common";
import {
  type EmailResponse,
  type SendBatchEmailsInput,
  type SendEmailInput,
  sendEmailSchema,
} from "../types/email.types.js";
import { EMAIL_TEMPLATES, renderTemplate, type EmailTemplate } from "../templates/index.js";

export interface SmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  transport?: TransportOptions | Record<string, unknown>;
}

export interface EmailServiceOptions {
  smtp?: SmtpConfig;
  persistToFile?: boolean;
  quiet?: boolean;
}

@Injectable()
export class EmailService {
  private transporter?: Transporter;
  private from: string;
  private persistToFile: boolean;
  private quiet: boolean;

  constructor(readonly options: EmailServiceOptions = {}) {
    const cfg = options.smtp ?? EmailService.smtpFromEnv();
    this.from = cfg.from ?? process.env.MAIL_FROM ?? "noreply@rocky.gov.mk";
    this.persistToFile = options.persistToFile ?? false;
    this.quiet = options.quiet ?? false;

    if (cfg.transport) {
      this.transporter = createTransport(cfg.transport as TransportOptions);
    } else if (cfg.host) {
      this.transporter = createTransport({
        host: cfg.host,
        port: cfg.port ?? (cfg.secure ? 465 : 587),
        secure: cfg.secure ?? cfg.port === 465,
        auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
      });
    }
  }

  static smtpFromEnv(): SmtpConfig {
    const host = process.env.SMTP_HOST;
    if (!host) return {};
    return {
      host,
      port: Number(process.env.SMTP_PORT ?? (process.env.SMTP_SECURE === "true" ? 465 : 587)),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.MAIL_FROM,
    };
  }

  async send(input: SendEmailInput): Promise<EmailResponse> {
    const parsed = sendEmailSchema.parse(input);
    const messageId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date().toISOString();

    const mail = {
      from: parsed.from.email,
      to: parsed.to.map((t) => (t.name ? `${t.name} <${t.email}>` : t.email)).join(", "),
      cc: parsed.cc?.map((t) => (t.name ? `${t.name} <${t.email}>` : t.email)).join(", "),
      bcc: parsed.bcc?.map((t) => (t.name ? `${t.name} <${t.email}>` : t.email)).join(", "),
      replyTo: parsed.replyTo?.email,
      subject: parsed.subject,
      text: parsed.text,
      html: parsed.html,
      attachments: parsed.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    };

    if (this.transporter) {
      try {
        const info: SentMessageInfo = await this.transporter.sendMail(mail);
        return {
          messageId: String(info.messageId ?? messageId),
          status: "sent",
          to: parsed.to.map((t) => t.email),
          subject: parsed.subject,
          timestamp,
        };
      } catch (error) {
        return {
          messageId,
          status: "failed",
          to: parsed.to.map((t) => t.email),
          subject: parsed.subject,
          timestamp,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    if (!this.quiet) {
      console.log(
        `[email] dev (not sent) [${messageId}] ${parsed.subject} -> ${parsed.to.map((t) => t.email).join(", ")}`,
      );
    }
    if (this.persistToFile) await this.saveToFile(parsed, messageId, timestamp);
    return {
      messageId,
      status: "queued",
      to: parsed.to.map((t) => t.email),
      subject: parsed.subject,
      timestamp,
    };
  }

  async sendBatch(input: SendBatchEmailsInput): Promise<EmailResponse[]> {
    const responses: EmailResponse[] = [];
    for (const emailData of input.emails) {
      responses.push(await this.send({ ...emailData, to: [emailData.to] }));
    }
    return responses;
  }

  async sendFromTemplate(params: {
    to: Array<{ email: string; name?: string }>;
    templateId: string;
    dynamicTemplateData: Record<string, unknown>;
    from?: { email: string; name?: string };
    language?: string;
  }): Promise<EmailResponse> {
    const template = (EMAIL_TEMPLATES as Record<string, EmailTemplate>)[params.templateId];
    if (!template) throw new Error(`Unknown email template: ${params.templateId}`);
    const { subject, body } = renderTemplate(template, params.language ?? "EN", params.dynamicTemplateData);
    return this.send({
      to: params.to,
      from: params.from ?? { email: this.from },
      subject,
      text: body,
      tag: params.templateId,
    });
  }

  async renderReact(template: ReactElement): Promise<string> {
    return (await render(template)) as string;
  }

  private async saveToFile(input: SendEmailInput, messageId: string, timestamp: string): Promise<void> {
    try {
      const dir = join(process.cwd(), "emails");
      mkdirSync(dir, { recursive: true });
      await writeFile(
        join(dir, `${messageId}.json`),
        JSON.stringify({ messageId, timestamp, ...input }, null, 2),
        "utf-8",
      );
    } catch (error) {
      console.error("Failed to save email to file:", error);
    }
  }
}

export async function renderReactEmail(template: ComponentType<any>, props: Record<string, unknown>): Promise<string> {
  return (await render(createElement(template, props))) as string;
}
