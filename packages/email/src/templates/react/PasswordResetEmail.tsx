import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface PasswordResetEmailProps {
  url: string;
  name?: string;
  locale?: "MK" | "EN" | "SQ" | "SR";
}

const COPY = {
  EN: {
    subject: "Reset your Rocky password",
    heading: "Reset your Rocky password",
    hi: "Hi",
    body: "We received a request to reset your password. This link expires in 1 hour. If you did not request this, you can safely ignore this email.",
    cta: "Reset password",
    footer: "Animal Identification & Movement Control System (AIMCS)",
  },
  MK: {
    subject: "Ресетирање на лозинката за Rocky",
    heading: "Ресетирање на лозинката",
    hi: "Здраво",
    body: "Добивме барање за ресетирање на вашата лозинка. Овој линк истекува за 1 час. Ако не го побаравте ова, можете да го игнорирате мејлот.",
    cta: "Ресетирај лозинка",
    footer: "Систем за идентификација на животни (AIMCS)",
  },
  SQ: {
    subject: "Rivendos fjalëkalimin të Rocky",
    heading: "Rivendos fjalëkalimin",
    hi: "Përshëndetje",
    body: "Marrëm një kërkesë për të rivendosur fjalëkalimin tuaj. Ky lidhje skadon pas 1 ore. Nëse nuk e keni kërkuar, mund ta injoroni.",
    cta: "Rivendos fjalëkalimin",
    footer: "Sistemi i Identifikimit të Kafshëve (AIMCS)",
  },
  SR: {
    subject: "Resetuj lozinku za Rocky",
    heading: "Resetujte lozinku",
    hi: "Zdravo",
    body: "Primili smo zahtev za resetovanje lozinke. Ova veza ističe za 1 sat. Ako niste zatražili, možete da je ignorišete.",
    cta: "Resetuj lozinku",
    footer: "Sistem Identifikacije Kretanja i Kontrole Životinja (AIMCS)",
  },
};

export function PasswordResetEmail({ url, name, locale = "EN" }: PasswordResetEmailProps) {
  const c = COPY[locale];
  const greeting = name ? `${c.hi} ${name}` : c.hi;
  return (
    <Html lang={(locale ?? "EN").toLowerCase()}>
      <Head />
      <Preview>{c.subject}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: "#f4f4f5", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "24px", backgroundColor: "#ffffff" }}>
          <Heading as="h1" style={{ fontSize: 20, color: "#18181b" }}>{c.heading}</Heading>
          <Text style={{ color: "#27272a", fontSize: 14, lineHeight: "20px" }}>{greeting},</Text>
          <Text style={{ color: "#27272a", fontSize: 14, lineHeight: "20px" }}>{c.body}</Text>
          <Section style={{ margin: "24px 0" }}>
            <Button
              href={url}
              style={{ backgroundColor: "#2563eb", color: "#ffffff", padding: "12px 20px", borderRadius: 6, textDecoration: "none", fontSize: 14 }}
            >
              {c.cta}
            </Button>
          </Section>
          <Hr style={{ borderColor: "#e4e4e7" }} />
          <Text style={{ color: "#71717a", fontSize: 12 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;
