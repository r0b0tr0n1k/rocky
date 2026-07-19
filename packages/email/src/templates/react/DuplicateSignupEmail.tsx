import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";

export interface DuplicateSignupEmailProps {
  email: string;
  name?: string;
  locale?: "MK" | "EN" | "SQ" | "SR";
}

const COPY = {
  EN: {
    subject: "Security alert from Rocky",
    heading: "Someone tried to sign up with your email",
    hi: "Hi",
    body: (e: string) =>
      `We received a sign-up request using your email address (${e}). If this was you, no action is needed. If you did not attempt to register, your account is safe and you can ignore this message.`,
    footer: "Animal Identification & Movement Control System (AIMCS)",
  },
  MK: {
    subject: "Безбедносно предупредување од Rocky",
    heading: "Некој се обиде да се регистрира со вашиот e-mail",
    hi: "Здраво",
    body: (e: string) =>
      `Добивме барање за регистрација со вашата e-mail адреса (${e}). Ако беше вие, не е потребна никаква акција. Ако не се обидовте да се регистрирате, вашиот профил е безбеден и можете да го игнорирате овој мејл.`,
    footer: "Систем за идентификација на животни (AIMCS)",
  },
  SQ: {
    subject: "Paralajmërim sigurie nga Rocky",
    heading: "Dikush u përpoq të regjistrohej me email-in tuaj",
    hi: "Përshëndetje",
    body: (e: string) =>
      `Marrëm një kërkesë regjistrimi duke përdorur adresën tënde email (${e}). Nëse ishe ti, nuk nevojitet asnjë veprim. Nëse nuk e ke kërkuar, llogaria jote është e sigurt dhe mund ta injorosh.`,
    footer: "Sistemi i Identifikimit të Kafshëve (AIMCS)",
  },
  SR: {
    subject: "Bezbednosno upozorenje od Rocky",
    heading: "Neko je pokušao da se registruje sa tvojim email-om",
    hi: "Zdravo",
    body: (e: string) =>
      `Primili smo zahtev za registraciju koristeći tvoju email adresu (${e}). Ako si ti to tražio, nije potrebna nikakva radnja. Ako nisi, tvoj nalog je bezbedan i možeš da ignorišeš.`,
    footer: "Sistem Identifikacije Kretanja i Kontrole Životinja (AIMCS)",
  },
};

export function DuplicateSignupEmail({ email, name, locale = "EN" }: DuplicateSignupEmailProps) {
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
          <Text style={{ color: "#27272a", fontSize: 14, lineHeight: "20px" }}>{c.body(email)}</Text>
          <Section style={{ margin: "24px 0" }} />
          <Hr style={{ borderColor: "#e4e4e7" }} />
          <Text style={{ color: "#71717a", fontSize: 12 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default DuplicateSignupEmail;
