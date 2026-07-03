import { writeFile } from "fs/promises";
import { mkdirSync } from "fs";
import { join } from "path";
import type { SendEmailInput, EmailResponse, SendBatchEmailsInput } from "../types/email.types";

/**
 * Email Service - Dummy Implementation for Development
 *
 * This service simulates email sending without requiring real SMTP credentials.
 * In production, replace this with SendGrid, AWS SES, or similar.
 *
 * Current Behavior:
 * - Logs email details to console
 * - Saves emails to ./emails/ directory (JSON format)
 * - Returns mock messageId
 *
 * TODO: Replace with real provider (SendGrid, AWS SES, etc.)
 */
export class EmailService {
  private emailsDir: string;
  private emailCounter: number = 0;

  constructor(private readonly options: EmailServiceOptions = {}) {
    // Set up email storage directory
    this.emailsDir = join(process.cwd(), "emails");
    try {
      mkdirSync(this.emailsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Send a single email
   */
  async send(input: SendEmailInput): Promise<EmailResponse> {
    this.emailCounter++;

    const messageId = `email_${Date.now()}_${this.emailCounter}`;
    const timestamp = new Date().toISOString();

    // Log to console (development mode)
    this.logToConsole(input, messageId);

    // Save to file (for testing/verification)
    await this.saveToFile(input, messageId, timestamp);

    // Return mock response
    return {
      messageId,
      status: "sent",
      to: input.to.map((t) => t.email),
      subject: input.subject,
      timestamp,
    };
  }

  /**
   * Send multiple emails in batch
   */
  async sendBatch(input: SendBatchEmailsInput): Promise<EmailResponse[]> {
    const responses: EmailResponse[] = [];

    for (const emailData of input.emails) {
      const response = await this.send({
        ...emailData,
        to: [emailData.to],
      });
      responses.push(response);
    }

    return responses;
  }

  /**
   * Send from template
   */
  async sendFromTemplate(params: {
    to: Array<{ email: string; name?: string }>;
    templateId: string;
    dynamicTemplateData: Record<string, unknown>;
    from: { email: string; name?: string };
  }): Promise<EmailResponse> {
    // In production, this would use SendGrid's template system
    // For now, we'll create a simple text representation

    const subject = `[Template: ${params.templateId}] Email Notification`;
    const text = this.renderTemplateText(params.dynamicTemplateData);

    return this.send({
      to: params.to,
      from: params.from,
      subject,
      text,
      tag: params.templateId,
    });
  }

  /**
   * Log email to console
   */
  private logToConsole(input: SendEmailInput, messageId: string): void {
    console.log("\n" + "=".repeat(70));
    console.log(`📧 EMAIL SENT [${messageId}]`);
    console.log("=".repeat(70));
    console.log(`From: ${this.formatAddress(input.from)}`);
    console.log(`To: ${input.to.map((t) => this.formatAddress(t)).join(", ")}`);

    if (input.cc && input.cc.length > 0) {
      console.log(`Cc: ${input.cc.map((t) => this.formatAddress(t)).join(", ")}`);
    }

    console.log(`Subject: ${input.subject}`);
    console.log("-".repeat(70));
    console.log(input.text);

    if (input.html) {
      console.log("-".repeat(70));
      console.log(`HTML: ${input.html.substring(0, 100)}...`);
    }

    if (input.attachments && input.attachments.length > 0) {
      console.log(`Attachments: ${input.attachments.map((a) => a.filename).join(", ")}`);
    }

    if (input.tag) {
      console.log(`Tag: ${input.tag}`);
    }

    if (input.templateId) {
      console.log(`Template ID: ${input.templateId}`);
    }

    if (input.dynamicTemplateData) {
      console.log(`Template Data:`, input.dynamicTemplateData);
    }

    console.log("=".repeat(70) + "\n");
  }

  /**
   * Save email to file for testing
   */
  private async saveToFile(input: SendEmailInput, messageId: string, timestamp: string): Promise<void> {
    const filename = join(this.emailsDir, `${messageId}.json`);

    const emailData = {
      messageId,
      timestamp,
      from: input.from,
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments,
      tag: input.tag,
      templateId: input.templateId,
      dynamicTemplateData: input.dynamicTemplateData,
    };

    try {
      await writeFile(filename, JSON.stringify(emailData, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save email to file:", error);
    }
  }

  /**
   * Format email address
   */
  private formatAddress(address: { email: string; name?: string }): string {
    if (address.name) {
      return `${address.name} <${address.email}>`;
    }
    return address.email;
  }

  /**
   * Render template as text (mock)
   */
  private renderTemplateText(data: Record<string, unknown>): string {
    const lines = Object.entries(data).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);

    return `Template Data:\n${lines.join("\n")}`;
  }
}

export interface EmailServiceOptions {
  /**
   * Log level: 'verbose', 'normal', 'quiet'
   */
  logLevel?: "verbose" | "normal" | "quiet";

  /**
   * Save emails to file system
   */
  persistToFile?: boolean;

  /**
   * Custom emails directory
   */
  emailsDir?: string;
}
