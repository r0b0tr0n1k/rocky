/**
 * Email Templates for Rocky AIMCS
 *
 * Multi-language email templates for common notifications.
 * These are simple string templates - in production, use SendGrid template editor.
 */

export interface EmailTemplate {
  subject: {
    [key: string]: string; // language code
  };
  body: {
    [key: string]: string; // language code
  };
  variables: string[];
}

// ============================================================================
// Birth Tagging Deadline Template
// ============================================================================

export const BIRTH_TAGGING_DEADLINE_TEMPLATE: EmailTemplate = {
  subject: {
    MK: "⚠️ Рок за етикетирање на телето - {{daysRemaining}} ден останат",
    EN: "⚠️ Calf Tagging Deadline - {{daysRemaining}} Day(s) Remaining",
    SQ: "⚠️ Afati i Etiketimit të Viçave - {{daysRemaining}} Ditë të Mbetura",
    SR: "⚠️ Rok Oznakčivanja Telećeta - {{daysRemaining}} Dana Preostalo",
  },
  body: {
    MK: `Почитувани {{vetName}},

Вашата родилка на фармата {{farmName}} треба да се етикетира до {{deadline}}.

Детали:
- Број на телета: {{calfCount}}
- Фарма: {{farmName}}
- Рок: {{deadline}}
- Дни преостанати: {{daysRemaining}}

Ве молиме да ја завршите етикетата навреме.

Со почит,
Систем за идентификација на животни (AIMCS)`,
    EN: `Dear {{vetName}},

Your calf at farm {{farmName}} must be tagged by {{deadline}}.

Details:
- Number of calves: {{calfCount}}
- Farm: {{farmName}}
- Deadline: {{deadline}}
- Days remaining: {{daysRemaining}}

Please complete the tagging on time.

Regards,
Animal Identification & Movement Control System (AIMCS)`,
    SQ: `I dashuruar {{vetName}},

Viça juaja në fermë {{farmName}} duhet të etiketohet deri në {{deadline}}.

Detajet:
- Numri i viçave: {{calfCount}}
- Fermë: {{farmName}}
- Afati: {{deadline}}
- Ditë të mbetura: {{daysRemaining}}

Ju lutem, të plotësoni etiketimin në kohë.

Me respekt,
Sistemi i Identifikimit të Kafshëve (AIMCS)`,
    SR: `Poštovani {{vetName}},

Vaše tele na farmi {{farmName}} mora biti označeno do {{deadline}}.

Detalji:
- Broj teladi: {{calfCount}}
- Farma: {{farmName}}
- Rok: {{deadline}}
- Dana preostalo: {{daysRemaining}}

Molim vas da završite označivanje na vreme.

S poštovanjem,
Sistem Identifikacije Kretanja i Kontrole Životinja (AIMCS)`,
  },
  variables: ["vetName", "farmName", "calfCount", "deadline", "daysRemaining"],
};

// ============================================================================
// Ear Tag Low Stock Template
// ============================================================================

export const EAR_TAG_LOW_STOCK_TEMPLATE: EmailTemplate = {
  subject: {
    MK: "⚠️ Ниска залиха на етикети: {{typeName}}",
    EN: "⚠️ Low Stock Alert: {{typeName}} Tags",
    SQ: "⚠️ Stoku i Ulët i Etiketave: {{typeName}}",
    SR: "⚠️ Niska Zaliha Oznaka: {{typeName}}",
  },
  body: {
    MK: `Почитувани {{adminName}},

Се забележува ниска залиха на етикети:

Тип: {{typeName}}
Достапни: {{availableCount}}
Праг: {{threshold}}

Ве молиме да нарачете нови етикети на време.

Со почит,
Систем за идентификација на животни (AIMCS)`,
    EN: `Dear {{adminName}},

Low stock alert for ear tags:

Type: {{typeName}}
Available: {{availableCount}}
Threshold: {{threshold}}

Please order new tags in time.

Regards,
Animal Identification & Movement Control System (AIMCS)`,
    SQ: `I dashuruar {{adminName}},

Alarm për stok të ulët i etiketave:

Lloji: {{typeName}}
Të disponueshme: {{availableCount}}
Pragu: {{threshold}}

Ju lutem, porositni etiketa të reja në kohë.

Me respekt,
Sistemi i Identifikimit të Kafshëve (AIMCS)`,
    SR: `Poštovani {{adminName}},

Alarm za nisku zalihu oznaka:

Tip: {{typeName}}
Dostupno: {{availableCount}}
Prag: {{threshold}}

Molim vas da naručete nove oznake na vreme.

S poštovanjem,
Sistem Identifikacije Kretanja i Kontrole Životinja (AIMCS)`,
  },
  variables: ["adminName", "typeName", "availableCount", "threshold"],
};

// ============================================================================
// Farm Registration Verification Template
// ============================================================================

export const FARM_VERIFICATION_TEMPLATE: EmailTemplate = {
  subject: {
    MK: "🔍 Верификација на фармата: {{farmName}}",
    EN: "🔍 Farm Verification Required: {{farmName}}",
    SQ: "🔍 Verifikimi i Fermës: {{farmName}}",
    SR: "🔍 Verifikacija Farme: {{farmName}}",
  },
  body: {
    MK: `Почитувани {{vdStaffName}},

Нова регистриција на фармата чека на верификација:

Фарма: {{farmName}}
- Локација: {{location}}
- Тип: {{type}}
- Сопственик: {{ownerName}}
- Сумптиков: {{submittedAt}}

Ве молиме да ја проверите фармата и да ја одобрите или одбиете.

Влез во системот за верификација.

Со почит,
Систем за идентификација на животни (AIMCS)`,
    EN: `Dear {{vdStaffName}},

A new farm registration is pending verification:

Farm: {{farmName}}
- Location: {{location}}
- Type: {{type}}
- Owner: {{ownerName}}
- Submitted: {{submittedAt}}

Please review and approve or reject the registration.

Login to the system to verify.

Regards,
Animal Identification & Movement Control System (AIMCS)`,
    SQ: `I dashuruar {{vdStaffName}},

Regjistrimi i ri i fermës po pret verifikim:

Ferma: {{farmName}}
- Vendndodhje: {{location}}
- Tipi: {{type}}
- Pronari: {{ownerName}}
- Paraqitur: {{submittedAt}}

Ju lutem, rishikoni dhe miratoni ose regjistrim.

Hyni në sistem për verifikim.

Me respekt,
Sistemi i Identifikimit të Kafshëve (AIMCS)`,
    SR: `Poštovani {{vdStaffName}},

Nova registracija farme čeka na verifikaciju:

Farma: {{farmName}}
- Lokacija: {{location}}
- Tip: {{type}}
- Vlasnik: {{ownerName}}
- Podneto: {{submittedAt}}

Molim vas da pregdate i odobrite ili odbijte registraciju.

Prijavite se u sistem za verifikaciju.

S poštovanjem,
Sistem Identifikacije Kretanja i Kontrole Životinja (AIMCS)`,
  },
  variables: ["vdStaffName", "farmName", "location", "type", "ownerName", "submittedAt"],
};

// ============================================================================
// Animal Movement Verification Template
// ============================================================================

export const MOVEMENT_VERIFICATION_TEMPLATE: EmailTemplate = {
  subject: {
    MK: "🚜 Верификација на движење на животно: {{movementId}}",
    EN: "🚜 Animal Movement Verification: {{movementId}}",
    SQ: "🚜 Verifikimi i Lëvizjes s Kafshë: {{movementId}}",
    SR: "🚜 Verifikacija Kretanja Životinja: {{movementId}}",
  },
  body: {
    MK: `Почитувани {{vdStaffName}},

Ново движење на животно чека на верификација:

ID на движење: {{movementId}}
- Од фармата: {{fromFarm}}
- До фармата: {{toFarm}}
- Број на животни: {{animalCount}}
- Датум: {{movementDate}}
- Причина: {{reason}}

Ве молиме да го проверите движењето и да го одобрите.

Влез во системот за верификација.

Со почит,
Систем за идентификација на животни (AIMCS)`,
    EN: `Dear {{vdStaffName}},

A new animal movement is pending verification:

Movement ID: {{movementId}}
- From farm: {{fromFarm}}
- To farm: {{toFarm}}
- Number of animals: {{animalCount}}
- Date: {{movementDate}}
- Reason: {{reason}}

Please review the movement and approve it.

Login to the system to verify.

Regards,
Animal Identification & Movement Control System (AIMCS)`,
    SQ: `I dashuruar {{vdStaffName}},

Lëvizja e re kafshëve pret verifikim:

ID lëvizje: {{movementId}}
- Nga ferma: {{fromFarm}}
- Në fermë: {{toFarm}}
- Numri i kafshëve: {{animalCount}}
- Data: {{movementDate}}
- Arsyeja: {{reason}}

Ju lutem, rishikoni lëvizjen dhe miratoni atë.

Hyni në sistem për verifikim.

Me respekt,
Sistemi i Identifikimit të Kafshëve (AIMCS)`,
    SR: `Poštovani {{vdStaffName}},

Novo kretanje životinja čeka na verifikaciju:

ID kretanja: {{movementId}}
- Sa farme: {{fromFarm}}
- Na farmu: {{toFarm}}
- Broj životinja: {{animalCount}}
- Datum: {{movementDate}}
- Razlog: {{reason}}

Molim vas da pregdate kretanje i odobrite ga.

Prijavite se u sistem za verifikaciju.

S poštovanjem,
Sistem Identifikacije Kretanja i Kontrole Životinja (AIMCS)`,
  },
  variables: ["vdStaffName", "movementId", "fromFarm", "toFarm", "animalCount", "movementDate", "reason"],
};

// ============================================================================
// User Invitation Template
// ============================================================================

export const USER_INVITE_TEMPLATE: EmailTemplate = {
  subject: {
    MK: "✉️ Поканета за Rocky AIMCS",
    EN: "✉️ Invitation to Rocky AIMCS",
    SQ: "✉️ Ftesë për Rocky AIMCS",
    SR: "✉️ Pozivnica za Rocky AIMCS",
  },
  body: {
    MK: `Почитувани {{userName}},

Поканети сте да се приклучите на Системот за идентификација на животни (AIMCS).

Рола: {{role}}
- Организација: {{organization}}

Кликнете на следниот линк за да ја прифатите поканетата и да го поставите вашата лозинка:
{{inviteUrl}}

Линкотот важи {{expiryHours}} часа.

Со почит,
Систем за идентификација на животни (AIMCS)`,
    EN: `Dear {{userName}},

You have been invited to join the Animal Identification & Movement Control System (AIMCS).

Role: {{role}}
- Organization: {{organization}}

Click the link below to accept the invitation and set your password:
{{inviteUrl}}

This link expires in {{expiryHours}} hours.

Regards,
Animal Identification & Movement Control System (AIMCS)`,
    SQ: `I dashuruar {{userName}},

Jeni ftuar për t'u bashkoheni me Sistemin e Identifikimit të Kafshëve (AIMCS).

Roli: {{role}}
- Organizata: {{organization}}

Klikoni lidhjen më poshtëmë për të pranuar ftesën dhe për të vendosur fjalëkalimin tuaj:
{{inviteUrl}}

Lidhja skad në {{expiryHours}} orë.

Me respekt,
Sistemi i Identifikimit të Kafshëve (AIMCS)`,
    SR: `Poštovani {{userName}},

Pozvani ste da se pridružite Sistemu Identifikacije Kretanja i Kontrole Životinja (AIMCS).

Uloga: {{role}}
- Organizacija: {{organization}}

Kliknite na link ispod da biste prihvatili pozivnicu i postavili lozinku:
{{inviteUrl}}

Link važi {{expiryHours}} sati.

S poštovanjem,
Sistem Identifikacije Kretanja i Kontrole Životinja (AIMCS)`,
  },
  variables: ["userName", "role", "organization", "inviteUrl", "expiryHours"],
};

// ============================================================================
// Helper: Render Template
// ============================================================================

/**
 * Render email template with variables
 */
export function renderTemplate(
  template: EmailTemplate,
  language: string,
  variables: Record<string, unknown>,
): { subject: string; body: string } {
  let subject = template.subject[language] || template.subject["EN"] || "";
  let body = template.body[language] || template.body["EN"] || "";

  // Replace variables in {{variable}} format
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = String(value);

    subject = subject.replace(new RegExp(placeholder, "g"), replacement);
    body = body.replace(new RegExp(placeholder, "g"), replacement);
  }

  return { subject, body };
}

// Export all templates
export const EMAIL_TEMPLATES = {
  BIRTH_TAGGING_DEADLINE: BIRTH_TAGGING_DEADLINE_TEMPLATE,
  EAR_TAG_LOW_STOCK: EAR_TAG_LOW_STOCK_TEMPLATE,
  FARM_VERIFICATION: FARM_VERIFICATION_TEMPLATE,
  MOVEMENT_VERIFICATION: MOVEMENT_VERIFICATION_TEMPLATE,
  USER_INVITE: USER_INVITE_TEMPLATE,
};
