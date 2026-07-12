/**
 * PDF/A-3 + PAdES conformance gate (ADR-0082 §3 — the NoDrift guillotine).
 *
 * Emits a real signed PDF/A-3 sample (blank visual + embedded source + PAdES
 * seal) and, if `verapdf` is on PATH, validates it is actually PDF/A-3 and
 * signed. CI installs veraPDF; locally the sample is still written so it can
 * be inspected. Run: `pnpm verify:pdfa`.
 */
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { PDFDocument } from "@cantoo/pdf-lib";
import forge from "node-forge";
import { wrapPdfA3 } from "../src/engine/pdfa3.js";
import { Pkcs12Signer } from "../src/sign/pkcs12-signer.js";

function makeSelfSignedP12(password: string): Buffer {
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(Date.now() + 365 * 86_400_000);
  const attrs = [
    { name: "commonName", value: "Rocky Sample Signer" },
    { name: "organizationName", value: "Rocky" },
    { name: "countryName", value: "MK" },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, cert, password);
  return Buffer.from(forge.asn1.toDer(p12Asn1).getBytes(), "binary");
}

async function main(): Promise<void> {
  const doc = await PDFDocument.create();
  doc.addPage([400, 300]);
  const visual = await doc.save();

  const pdfa3 = await wrapPdfA3({
    pdf: visual,
    attachments: [
      {
        filename: "sample.yaml",
        buffer: new TextEncoder().encode("title: Rocky Sample\nstatus: signed\n"),
        mimeType: "application/yaml",
      },
    ],
    meta: { title: "Sample", subject: "Rocky PDF/A-3 sample", documentId: "sample-1" },
  });

  const signed = await new Pkcs12Signer({
    p12: makeSelfSignedP12("password"),
    passphrase: "password",
  }).sign(pdfa3);

  const outPath = process.env.PDFA_SAMPLE_PATH ?? "/tmp/rocky-sample-pdfa3.pdf";
  writeFileSync(outPath, signed);
  console.log(`Wrote signed PDF/A-3 sample: ${outPath} (${signed.length} bytes)`);

  try {
    execSync("command -v verapdf", { stdio: "ignore" });
  } catch {
    console.warn(
      "veraPDF not installed — skipping strict conformance check. " +
        "Install veraPDF (https://verapdf.org) and re-run for the /A-3 + PAdES gate.",
    );
    return;
  }

  try {
    execSync(`verapdf --format xml "${outPath}"`, { encoding: "utf8" });
  } catch (e) {
    // veraPDF exits non-zero on non-compliance (or a tool error).
    const out = (e as { stdout?: string; stderr?: string }).stdout ?? "";
    console.error("veraPDF: PDF/A-3 NOT compliant\n" + out);
    process.exit(1);
  }
  console.log("veraPDF: PDF/A-3 compliant ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
