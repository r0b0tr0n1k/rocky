# Email Package - Dummy Implementation

**Date:** 2025-01-02
**Status:** ✅ Complete
**Location:** `packages/email/`

## Overview

The `@rocky/email` package provides a **dummy email service** for development and testing. It simulates email sending without requiring real SMTP credentials or API keys.

## What It Does

### Current Behavior (Dummy Mode)

1. **Logs to Console**
   - Full email details (to, from, subject, body)
   - Formatted output with box drawing characters
   - Easy to see during development

2. **Saves to File System**
   - Stores emails in `./emails/` directory
   - JSON format for easy inspection
   - Filename: `email_[timestamp]_[counter].json`

3. **Returns Mock Response**
   - Generates `messageId` for tracking
   - Returns `status: "sent"`
   - Simulates real API response

## Usage Examples

### Basic Email

```typescript
import { EmailService } from "@rocky/email";

const emailService = new EmailService();

await emailService.send({
  to: [{ email: "user@example.com", name: "John Doe" }],
  from: { email: "noreply@rocky.gov.mk", name: "Rocky AIMCS" },
  subject: "Test Email",
  text: "This is a test email"
});
```

**Console Output:**
```
======================================================================
📧 EMAIL SENT [email_1704207200000_1]
======================================================================
From: Rocky AIMCS <noreply@rocky.gov.mk>
To: John Doe <user@example.com>
Subject: Test Email
----------------------------------------------------------------------
This is a test email
======================================================================
```

**File Saved:**
```json
// emails/email_1704207200000_1.json
{
  "messageId": "email_1704207200000_1",
  "timestamp": "2025-01-02T10:00:00.000Z",
  "from": { "email": "noreply@rocky.gov.mk", "name": "Rocky AIMCS" },
  "to": [{ "email": "user@example.com", "name": "John Doe" }],
  "subject": "Test Email",
  "text": "This is a test email"
}
```

### HTML Email

```typescript
await emailService.send({
  to: [{ email: "user@example.com" }],
  from: { email: "noreply@rocky.gov.mk" },
  subject: "Welcome",
  text: "Plain text version",
  html: "<h1>Welcome</h1><p>HTML version</p>"
});
```

### With Attachments

```typescript
await emailService.send({
  to: [{ email: "user@example.com" }],
  from: { email: "noreply@rocky.gov.mk" },
  subject: "Report Attached",
  text: "Please find the report attached",
  attachments: [
    {
      filename: "report.pdf",
      contentType: "application/pdf",
      content: pdfBuffer
    }
  ]
});
```

### Batch Emails

```typescript
const responses = await emailService.sendBatch({
  emails: [
    {
      to: { email: "user1@example.com" },
      from: { email: "noreply@rocky.gov.mk" },
      subject: "Notification 1",
      text: "Content 1"
    },
    {
      to: { email: "user2@example.com" },
      from: { email: "noreply@rocky.gov.mk" },
      subject: "Notification 2",
      text: "Content 2"
    }
  ]
});
```

### With Template

```typescript
import { renderTemplate, BIRTH_TAGGING_DEADLINE_TEMPLATE } from "@rocky/email";

const { subject, body } = renderTemplate(
  BIRTH_TAGGING_DEADLINE_TEMPLATE,
  "MK", // language
  {
    vetName: "Dr. Petkovski",
    farmName: "Фарма Петков",
    calfCount: 3,
    deadline: "2025-01-15",
    daysRemaining: 1
  }
);

await emailService.send({
  to: [{ email: "vet@example.com" }],
  from: { email: "noreply@rocky.gov.mk" },
  subject,
  text: body
});
```

## Email Templates

The package includes multi-language templates for common Rocky notifications:

### Available Templates

1. **`BIRTH_TAGGING_DEADLINE_TEMPLATE`** - 20-day tagging deadline alerts
2. **`EAR_TAG_LOW_STOCK_TEMPLATE`** - Inventory low stock warnings
3. **`FARM_VERIFICATION_TEMPLATE`** - Farm registration pending verification
4. **`MOVEMENT_VERIFICATION_TEMPLATE`** - Animal movement verification requests
5. **`USER_INVITE_TEMPLATE`** - User registration invitations

### Template Variables

Each template uses `{{variable}}` syntax:

```typescript
// Birth tagging deadline example
{
  vetName: "Dr. Petkovski",
  farmName: "Фарма Петков",
  calfCount: 3,
  deadline: "2025-01-15",
  daysRemaining: 1
}

// Subject: "⚠️ Рок за етикетирање на телето - 1 ден останат"
// Body includes all variables replaced
```

## Integration with Notification Worker

### Current Implementation (apps/api/src/notification/notification-worker.service.ts)

```typescript
import { EmailService } from "@rocky/email";

export class NotificationWorkerService {
  private readonly emailService = new EmailService();

  private async sendEmail(notification: any): Promise<string> {
    // Use email service
    const response = await this.emailService.send({
      to: [{ email: notification.emailAddress }],
      from: { email: "noreply@rocky.gov.mk", name: "Rocky AIMCS" },
      subject: notification.subject,
      text: notification.message
    });

    return response.messageId;
  }
}
```

### Update Required

Replace the mock implementation in `notification-worker.service.ts`:

**Before:**
```typescript
private async sendEmail(notification: any): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return `email_${notification.id}_${Date.now()}`;
}
```

**After:**
```typescript
private async sendEmail(notification: any): Promise<string> {
  const response = await this.emailService.send({
    to: [{ email: notification.emailAddress }],
    from: { email: "noreply@rocky.gov.mk", name: "Rocky AIMCS" },
    subject: notification.subject,
    text: notification.message,
    data: notification.data
  });

  return response.messageId;
}
```

## File Structure

```
packages/email/
├── src/
│   ├── services/
│   │   └── email.service.ts       # EmailService class
│   ├── types/
│   │   └── email.types.ts          # TypeScript types
│   ├── templates/
│   │   └── index.ts                # Email templates (MK/EN/SQ/SR)
│   └── index.ts                    # Package exports
├── emails/                         # Generated email files (runtime)
├── package.json
└── tsconfig.json
```

## API Reference

### `EmailService`

#### Constructor

```typescript
constructor(options?: EmailServiceOptions)
```

**Options:**
- `logLevel?: "verbose" | "normal" | "quiet"` - Console logging detail
- `persistToFile?: boolean` - Save emails to file system (default: true)
- `emailsDir?: string` - Custom directory for email files

#### Methods

**`send(input: SendEmailInput): Promise<EmailResponse>`**

Send a single email.

**Parameters:**
- `to` - Recipients (array of email addresses)
- `from` - Sender email address
- `subject` - Email subject
- `text` - Plain text body
- `html` - HTML body (optional)
- `attachments` - File attachments (optional)
- `cc` - CC recipients (optional)
- `bcc` - BCC recipients (optional)
- `tag` - Tag for categorization (optional)
- `templateId` - Template ID (optional)
- `dynamicTemplateData` - Template variables (optional)

**Returns:**
- `messageId` - Mock message ID
- `status` - Always "sent"
- `to` - Array of recipient emails
- `subject` - Email subject
- `timestamp` - ISO timestamp

---

**`sendBatch(input: SendBatchEmailsInput): Promise<EmailResponse[]>`**

Send multiple emails in batch.

---

**`sendFromTemplate(params): Promise<EmailResponse>`**

Send email using template (simplified for dummy mode).

## Package Configuration

### package.json

```json
{
  "name": "@rocky/email",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "zod": "^4.0.0"
  }
}
```

### Install in Other Packages

```bash
# In apps/api
pnpm add @rocky/email@workspace:*
```

## Testing

### Unit Tests

```typescript
import { EmailService } from "@rocky/email";

describe("EmailService", () => {
  it("should send email and return response", async () => {
    const emailService = new EmailService();

    const response = await emailService.send({
      to: [{ email: "test@example.com" }],
      from: { email: "noreply@rocky.gov.mk" },
      subject: "Test",
      text: "Test body"
    });

    expect(response.status).toBe("sent");
    expect(response.messageId).toMatch(/^email_/);
  });
});
```

### Integration Tests

```typescript
import { EmailService } from "@rocky/email";
import { readFileSync } from "fs";
import { join } from "path";

describe("EmailService Integration", () => {
  it("should save email to file", async () => {
    const emailService = new EmailService();

    const response = await emailService.send({
      to: [{ email: "test@example.com" }],
      from: { email: "noreply@rocky.gov.mk" },
      subject: "Test",
      text: "Test body"
    });

    // Check file was created
    const filePath = join(process.cwd(), "emails", `${response.messageId}.json`);
    const content = JSON.parse(readFileSync(filePath, "utf-8"));

    expect(content.subject).toBe("Test");
  });
});
```

## Production Migration

When ready to switch to real email provider:

### Option 1: SendGrid (Recommended)

```bash
pnpm add @sendgrid/mail
```

**Replace email.service.ts:**
```typescript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export class EmailService {
  async send(input: SendEmailInput): Promise<EmailResponse> {
    const msg = {
      to: input.to.map((t) => t.email),
      from: `${input.from.name} <${input.from.email}>`,
      subject: input.subject,
      text: input.text,
      html: input.html,
    };

    const response = await sgMail.send(msg);

    return {
      messageId: response.headers["x-message-id"],
      status: "sent",
      to: input.to.map((t) => t.email),
      subject: input.subject,
      timestamp: new Date().toISOString()
    };
  }
}
```

### Option 2: AWS SES (Cheaper)

```bash
pnpm add @aws-sdk/client-ses
```

**Replace email.service.ts:**
```typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: "eu-central-1" });

export class EmailService {
  async send(input: SendEmailInput): Promise<EmailResponse> {
    const command = new SendEmailCommand({
      Source: input.from.email,
      Destination: {
        ToAddresses: input.to.map((t) => t.email)
      },
      Message: {
        Subject: { Data: input.subject },
        Body: { Text: { Data: input.text } }
      }
    });

    const response = await ses.send(command);

    return {
      messageId: response.MessageId,
      status: "sent",
      to: input.to.map((t) => t.email),
      subject: input.subject,
      timestamp: new Date().toISOString()
    };
  }
}
```

### Option 3: Resend (Modern, Developer-Friendly)

```bash
pnpm add resend
```

**Replace email.service.ts:**
```typescript
import { Resend } from "resend";

const resend = new Resend("re_123456789");

export class EmailService {
  async send(input: SendEmailInput): Promise<EmailResponse> {
    const response = await resend.emails.send({
      from: input.from.email,
      to: input.to.map((t) => t.email),
      subject: input.subject,
      text: input.text,
      html: input.html
    });

    return {
      messageId: response.data?.id || "unknown",
      status: "sent",
      to: input.to.map((t) => t.email),
      subject: input.subject,
      timestamp: new Date().toISOString()
    };
  }
}
```

## Files Created

### Package Files (4)
- `src/services/email.service.ts`
- `src/types/email.types.ts`
- `src/templates/index.ts`
- `src/index.ts`

### Config Files (2)
- `package.json`
- `tsconfig.json`

### Runtime Files (1)
- `emails/` directory (created at runtime)

## Next Steps

1. **Install in apps/api:**
   ```bash
   cd apps/api
   pnpm add @rocky/email@workspace:*
   ```

2. **Update notification worker:**
   - Import EmailService
   - Replace mock sendEmail implementation

3. **Test:**
   - Start dev server
   - Trigger a notification
   - Check console for email log
   - Verify email saved in `apps/api/emails/`

4. **Future:**
   - Choose production provider (SendGrid recommended)
   - Replace EmailService implementation
   - Update notification-worker.service.ts
   - Test with real emails

## Conclusion

The `@rocky/email` package provides a **complete dummy email service** for development. It:

✅ Logs emails to console (easy to see during dev)
✅ Saves to file system (JSON for inspection)
✅ Returns mock response (simulates real API)
✅ Supports templates (MK/EN/SQ/SR languages)
✅ Type-safe with Zod schemas
✅ Easy to replace with real provider

**Status:** Ready for integration in notification worker service.

Would you like me to:
1. Update the notification-worker.service.ts to use this email package?
2. Show how to test the email service?
3. Compare SendGrid vs AWS SES vs Resend for production?
