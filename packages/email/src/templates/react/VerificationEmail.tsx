import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";

export interface VerificationEmailProps {
  url: string;
  name?: string;
  locale?: "MK" | "EN" | "SQ" | "SR";
}

const COPY = {
  EN: {
    subject: "Verify your Rocky account",
    heading: "Verify your email",
    hi: "Hi",
    body: "Confirm your email address to activate your Rocky account. This link expires in 1 hour. If you did not create this account, you can safely ignore this email.",
    cta: "Verify email",
    footer: "Animal Identification & Movement Control System (AIMCS)",
  },
  MK: {
    subject: "Потврди го Rocky профилот",
    heading: "Потврди ја e-mail адресата",
    hi: "Здраво",
    body: "Потврдете ја вашата e-mail адреса за да го активирате Rocky профилот. Овој линк истекува за 1 час. Ако не го креиравте профилот, можете да го игнорирате мејлот.",
    cta: "Потврди e-mail",
    footer: "Систем за идентификација на животни (AIMCS)",
  },
  SQ: {
    subject: "Verifiko llogarinë Rocky",
    heading: "Verifiko email-in",
    hi: "Përshëndetje",
    body: "Konfirmo adresën tënde email për të aktivizuar llogarinë Rocky. Ky lidhje skadon pas 1 ore. Nëse nuk e ke krijuar llogarinë, mund ta injorosh.",
    cta: "Verifiko email-in",
    footer: "Sistemi i Identifikimit të Kafshëve (AIMCS)",
  },
  SR: {
    subject: "Verifikuj Rocky nalog",
    heading: "Verifikuj email",
    hi: "Zdravo",
    body: "Potvrdi svoju email adresu da aktiviraš Rocky nalog. Ova veza ističe za 1 sat. Ako nisi kreirao nalog, možeš da je ignorišeš.",
    cta: "Verifikuj email",
    footer: "Sistem Identifikacije Kretanja i Kontrole Životinja (AIMCS)",
  },
};

export function VerificationEmail({ url, name, locale = "EN" }: VerificationEmailProps) {
  const c = COPY[locale];
  const greeting = name ? `${c.hi} ${name}` : c.hi;
  return (
    <Html lang={(locale ?? "EN").toLowerCase()}>
      <Head />
      <Preview>{c.subject}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: "#f4f4f5", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "24px", backgroundColor: "#ffffff" }}>
          <Heading as="h1" style={{ fontSize: 20, color: "#18181b" }}>
            {c.heading}
          </Heading>
          <Text style={{ color: "#27272a", fontSize: 14, lineHeight: "20px" }}>{greeting},</Text>
          <Text style={{ color: "#27272a", fontSize: 14, lineHeight: "20px" }}>{c.body}</Text>
          <Section style={{ margin: "24px 0" }}>
            <Button
              href={url}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                padding: "12px 20px",
                borderRadius: 6,
                textDecoration: "none",
                fontSize: 14,
              }}
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

export default VerificationEmail;
