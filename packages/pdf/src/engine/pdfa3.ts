/**
 * PDF/A-3 wrapper for Rocky documents.
 *
 * Takes a *visual* PDF (the Typst render) and turns it into a conformant
 * PDF/A-3 hybrid container (ADR-0082):
 *
 *   1. embeds the source YAML/XML as an associated file (AFRelationship),
 *   2. writes the PDF/A-3 XMP metadata (pdfaid:part=3) + the AF extension
 *      schema declaration,
 *   3. adds an sRGB OutputIntent (mandatory for /A conformance),
 *   4. marks the document and adds a StructTreeRoot placeholder,
 *   5. sets a deterministic trailer ID.
 *
 * The result is a self-describing, decades-stable container. The PAdES seal
 * (see `../sign`) is applied *after* this wrap, on the returned buffer.
 *
 * This replicates (and generalizes) the mechanism used by the vendored
 * `@e-invoice-eu/core` Factur-X writer, implemented directly against
 * `@cantoo/pdf-lib` so `@rocky/pdf` has no hard dependency on the vendored tree.
 */

import {
  AFRelationship,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFString,
} from "@cantoo/pdf-lib";
import { webcrypto } from "node:crypto";

/** Standard sRGB IEC61966-2-1 ICC profile (de-facto standard asset). */
const SRGB_ICC_BASE64 = `
AAAL0AAAAAACAAAAbW50clJHQiBYWVogB98AAgAPAAAAAAAAYWNzcAAAAAAAAAAAAAAAAAAAAAAA
AAABAAAAAAAAAAAAAPbWAAEAAAAA0y0AAAAAPQ6y3q6Tl76bZybOjApDzgAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAQZGVzYwAAAUQAAABjYlhZWgAAAagAAAAUYlRSQwAAAbwAAAgMZ1RS
QwAAAbwAAAgMclRSQwAAAbwAAAgMZG1kZAAACcgAAACIZ1hZWgAAClAAAAAUbHVtaQAACmQAAAAU
bWVhcwAACngAAAAkYmtwdAAACpwAAAAUclhZWgAACrAAAAAUdGVjaAAACsQAAAAMdnVlZAAACtAA
AACHd3RwdAAAC1gAAAAUY3BydAAAC2wAAAA3Y2hhZAAAC6QAAAAsZGVzYwAAAAAAAAAJc1JHQjIw
MTQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAAAkoAAAD4QAALbPY3VydgAAAAAAAAQA
AAAABQAKAA8AFAAZAB4AIwAoAC0AMgA3ADsAQABFAEoATwBUAFkAXgBjAGgAbQByAHcAfACBAIYA
iwCQAJUAmgCfAKQAqQCuALIAtwC8AMEAxgDLANAA1QDbAOAA5QDrAPAA9gD7AQEBBwENARMBGQEf
ASUBKwEyATgBPgFFAUwBUgFZAWABZwFuAXUBfAGDAYsBkgGaAaEBqQGxAbkBwQHJAdEB2QHhAekB
8gH6AgMCDAIUAh0CJgIvAjgCQQJLAlQCXQJnAnECegKEAo4CmAKiAqwCtgLBAssC1QLgAusC9QMA
AwsDFgMhAy0DOANDA08DWgNmA3IDfgOKA5YDogOuA7oDxwPTA+AD7AP5BAYEEwQgBC0EOwRIBFUE
YwRxBH4EjASaBKgEtgTEBNME4QTwBP4FDQUcBSsFOgVJBVgFZwV3BYYFlgWmBbUFxQXVBeUF9gYG
BhYGJwY3BkgGWQZqBnsGjAadBq8GwAbRBuMG9QcHBxkHKwc9B08HYQd0B4YHmQesB78H0gflB/gI
CwgfCDIIRghaCG4IggiWCKoIvgjSCOcI+wkQCSUJOglPCWQJeQmPCaQJugnPCeUJ+woRCicKPQpU
CmoKgQqYCq4KxQrcCvMLCwsiCzkLUQtpC4ALmAuwC8gL4Qv5DBIMKgxDDFwMdQyODKcMwAzZDPMN
DQ0mDUANWg10DY4NqQ3DDd4N+A4TDi4OSQ5kDn8Omw62DtIO7g8JDyUPQQ9eD3oPlg+zD88P7BAJ
ECYQQxBhEH4QmxC5ENcQ9RETETERTxFtEYwRqhHJEegSBxImEkUSZBKEEqMSwxLjEwMTIxNDE2MT
gxOkE8UT5RQGFCcUSRRqFIsUrRTOFPAVEhU0FVYVeBWbFb0V4BYDFiYWSRZsFo8WshbWFvoXHRdB
F2UXiReuF9IX9xgbGEAYZRiKGK8Y1Rj6GSAZRRlrGZEZtxndGgQaKhpRGncanhrFGuwbFBs7G2Mb
ihuyG9ocAhwqHFIcexyjHMwc9R0eHUcdcB2ZHcMd7B4WHkAeah6UHr4e6R8THz4faR+UH78f6iAV
IEEgbCCYIMQg8CEcIUghdSGhIc4h+yInIlUigiKvIt0jCiM4I2YjlCPCI/AkHyRNJHwkqyTaJQkl
OCVoJZclxyX3JicmVyaHJrcm6CcYJ0kneierJ9woDSg/KHEooijUKQYpOClrKZ0p0CoCKjUqaCqb
Ks8rAis2K2krnSvRLAUsOSxuLKIs1y0MLUEtdi2rLeEuFi5MLoIuty7uLyQvWi+RL8cv/jA1MGww
pDDbMRIxSjGCMbox8jIqMmMymzLUMw0zRjN/M7gz8TQrNGU0njTYNRM1TTWHNcI1/TY3NnI2rjbp
NyQ3YDecN9c4FDhQOIw4yDkFOUI5fzm8Ofk6Njp0OrI67zstO2s7qjvoPCc8ZTykPOM9Ij1hPaE9
4D4gPmA+oD7gPyE/YT+iP+JAI0BkQKZA50EpQWpBrEHuQjBCckK1QvdDOkN9Q8BEA0RHRIpEzkUS
RVVFmkXeRiJGZ0arRvBHNUd7R8BIBUhLSJFI10kdSWNJqUnwSjdKfUrESwxLU0uaS+JMKkxyTLpN
Ak1KTZNN3E4lTm5Ot08AT0lPk0/dUCdQcVC7UQZRUFGbUeZSMVJ8UsdTE1NfU6pT9lRCVI9U21Uo
VXVVwlYPVlxWqVb3V0RXklfgWC9YfVjLWRpZaVm4WgdaVlqmWvVbRVuVW+VcNVyGXNZdJ114Xcle
Gl5sXr1fD19hX7NgBWBXYKpg/GFPYaJh9WJJYpxi8GNDY5dj62RAZJRk6WU9ZZJl52Y9ZpJm6Gc9
Z5Nn6Wg/aJZo7GlDaZpp8WpIap9q92tPa6dr/2xXbK9tCG1gbbluEm5rbsRvHm94b9FwK3CGcOBx
OnGVcfByS3KmcwFzXXO4dBR0cHTMdSh1hXXhdj52m3b4d1Z3s3gReG54zHkqeYl553pGeqV7BHtj
e8J8IXyBfOF9QX2hfgF+Yn7CfyN/hH/lgEeAqIEKgWuBzYIwgpKC9INXg7qEHYSAhOOFR4Wrhg6G
cobXhzuHn4gEiGmIzokziZmJ/opkisqLMIuWi/yMY4zKjTGNmI3/jmaOzo82j56QBpBukNaRP5Go
khGSepLjk02TtpQglIqU9JVflcmWNJaflwqXdZfgmEyYuJkkmZCZ/JpomtWbQpuvnByciZz3nWSd
0p5Anq6fHZ+Ln/qgaaDYoUehtqImopajBqN2o+akVqTHpTilqaYapoum/adup+CoUqjEqTepqaoc
qo+rAqt1q+msXKzQrUStuK4trqGvFq+LsACwdbDqsWCx1rJLssKzOLOutCW0nLUTtYq2AbZ5tvC3
aLfguFm40blKucC6O7q1uy67p7whvJu9Fb2Pvgq+hL7/v3q/9cBwwOzBZ8Hjwl/C28NYw9TEUcTO
xUvFyMZGxsPHQce/yD3IvMk6ybnKOMq3yzbLtsw1zLXNNc21zjbOts83z7jQOdC60TzRvtI/0sHT
RNPG1EnUy9VO1dHWVdbY11zX4Nhk2OjZbNnx2nba+9uA3AXcit0Q3ZbeHN6i3ynfr+A24L3hROHM
4lPi2+Nj4+vkc+T85YTmDeaW5x/nqegy6LzpRunQ6lvq5etw6/vshu0R7ZzuKO6070DvzPBY8OXx
cvH/8ozzGfOn9DT0wvVQ9d72bfb794r4Gfio+Tj5x/pX+uf7d/wH/Jj9Kf26/kv+3P9t//9kZXNj
AAAAAAAAAC5JRUMgNjE5NjYtMi0xIERlZmF1bHQgUkdCIENvbG91ciBTcGFjZSAtIHNSR0IAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAAAAAUAAAAAAA
AG1lYXMAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlhZWiAAAAAAAAAAngAAAKQAAACH
WFlaIAAAAAAAAG+iAAA49QAAA5BzaWcgAAAAAENSVCBkZXNjAAAAAAAAAC1SZWZlcmVuY2UgVmll
d2luZyBDb25kaXRpb24gaW4gSUVDIDYxOTY2LTItMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWFla
IAAAAAAAAPbWAAEAAAAA0y10ZXh0AAAAAENvcHlyaWdodCBJbnRlcm5hdGlvbmFsIENvbG9yIENv
bnNvcnRpdW0sIDIwMTUAAHNmMzIAAAAAAAEMRAAABd////MmAAAHlAAA/Y////uh///9ogAAA9sA
AMB1
`.trim();

export type PdfA3Conformance = "A" | "B";

export interface PdfA3Attachment {
  /** File name shown in the PDF attachments panel. */
  filename: string;
  /** Raw bytes (or base64 string) of the associated file. */
  buffer: Uint8Array | ArrayBuffer | string;
  /** MIME type, e.g. `application/xml` / `application/yaml`. */
  mimeType: string;
  /** Human-readable description. */
  description?: string;
  /** Associated-file relationship (defaults to `Alternative`). */
  afRelationship?: AFRelationship;
}

export interface PdfA3Meta {
  title: string;
  subject: string;
  author?: string;
  creator?: string;
  producer?: string;
  keywords?: string[];
  language?: string;
  /** Stable seed for the trailer ID (e.g. the document reference / UID). */
  documentId?: string;
  /** PDF/A conformance level (defaults to `B` — basic, no tagged structure). */
  conformance?: PdfA3Conformance;
}

export interface WrapPdfA3Input {
  /** The visual PDF bytes (e.g. the Typst render). */
  pdf: Uint8Array | ArrayBuffer;
  /** Associated files embedded into the hybrid container. */
  attachments: PdfA3Attachment[];
  meta: PdfA3Meta;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDateWithOffset(date: Date): string {
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - tzOffsetMs);
  const iso = local.toISOString().replace("Z", "");
  const offsetHours = -date.getTimezoneOffset() / 60;
  const sign = offsetHours >= 0 ? "+" : "-";
  const hours = String(Math.abs(offsetHours)).padStart(2, "0");
  return `${iso}${sign}${hours}:00`;
}

function buildXmp(meta: PdfA3Meta): string {
  const conformance = meta.conformance ?? "B";
  const author = escapeXml(meta.author ?? "Rocky");
  const creator = escapeXml(meta.creator ?? "Rocky PDF Service");
  const title = escapeXml(meta.title);
  const subject = escapeXml(meta.subject);
  const now = formatDateWithOffset(new Date());

  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/" rdf:about="">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>${conformance}</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" rdf:about="">
      <dc:format>application/pdf</dc:format>
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt></dc:title>
      <dc:creator><rdf:Seq><rdf:li>${author}</rdf:li></rdf:Seq></dc:creator>
      <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${subject}</rdf:li></rdf:Alt></dc:description>
    </rdf:Description>
    <rdf:Description xmlns:xmp="http://ns.adobe.com/xap/1.0/" rdf:about="">
      <xmp:CreatorTool>${creator}</xmp:CreatorTool>
      <xmp:CreateDate>${now}</xmp:CreateDate>
      <xmp:ModifyDate>${now}</xmp:ModifyDate>
      <xmp:MetadataDate>${now}</xmp:MetadataDate>
    </rdf:Description>
    <rdf:Description xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://schema.org/" xmlns:pdfaProperty="http://schema.org/Property" rdf:about="">
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>PDF/A-3 Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>http://www.aiim.org/pdfa/ns/af/ns/</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>af</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>AssociatedFiles</pdfaProperty:name>
                  <pdfaProperty:valueType>PDF/A-3:FileSpecification</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Associated Files</pdfaProperty:description>
                </rdf:li>
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function setOutputIntent(pdfDoc: PDFDocument): void {
  const profile = base64ToUint8Array(SRGB_ICC_BASE64);
  const profileStream = pdfDoc.context.stream(profile, { Length: profile.length });
  const profileRef = pdfDoc.context.register(profileStream);

  const outputIntent = pdfDoc.context.obj({
    Type: "OutputIntent",
    S: "GTS_PDFA1",
    OutputConditionIdentifier: PDFString.of("sRGB"),
    DestOutputProfile: profileRef,
  });
  const outputIntentRef = pdfDoc.context.register(outputIntent);
  pdfDoc.catalog.set(PDFName.of("OutputIntents"), pdfDoc.context.obj([outputIntentRef]));
}

function setMarkInfo(pdfDoc: PDFDocument): void {
  const markInfo = pdfDoc.context.obj({ Marked: true });
  pdfDoc.catalog.set(PDFName.of("MarkInfo"), markInfo);
}

function setStructTreeRoot(pdfDoc: PDFDocument): void {
  const structTree = pdfDoc.context.obj({ Type: PDFName.of("StructTreeRoot") });
  const structTreeRef = pdfDoc.context.register(structTree);
  pdfDoc.catalog.set(PDFName.of("StructTreeRoot"), structTreeRef);
}

function setXmpMetadata(pdfDoc: PDFDocument, xmp: string): void {
  const bytes = new TextEncoder().encode(xmp);
  const stream = pdfDoc.context.stream(bytes, {
    Type: PDFName.of("Metadata"),
    Subtype: PDFName.of("XML"),
  });
  const ref = pdfDoc.context.register(stream);
  pdfDoc.catalog.set(PDFName.of("Metadata"), ref);
}

async function setTrailerId(pdfDoc: PDFDocument, seed: string): Promise<void> {
  const data = new TextEncoder().encode(seed);
  const hash = await webcrypto.subtle.digest("SHA-512", data);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  pdfDoc.context.trailerInfo.ID = pdfDoc.context.obj([
    PDFHexString.of(hex),
    PDFHexString.of(hex),
  ]);
}

/**
 * Wrap a visual PDF into a PDF/A-3 hybrid container with the supplied
 * associated files embedded, then return the wrapped bytes.
 *
 * The returned buffer is ready to receive the PAdES seal (see `../sign`).
 */
export async function wrapPdfA3(input: WrapPdfA3Input): Promise<Uint8Array> {
  const { pdf, attachments, meta } = input;
  const pdfDoc = await PDFDocument.load(pdf, { updateMetadata: false });

  for (const attachment of attachments) {
    await pdfDoc.attach(attachment.buffer, attachment.filename, {
      mimeType: attachment.mimeType,
      description: attachment.description ?? "Source document",
      afRelationship: attachment.afRelationship ?? AFRelationship.Alternative,
    });
  }

  const now = new Date();
  pdfDoc.setAuthor(meta.author ?? "Rocky");
  pdfDoc.setCreationDate(now);
  pdfDoc.setCreator(meta.creator ?? "Rocky PDF Service");
  pdfDoc.setKeywords(meta.keywords ?? []);
  if (meta.language) pdfDoc.setLanguage(meta.language);
  pdfDoc.setModificationDate(now);
  pdfDoc.setProducer(meta.producer ?? "Rocky PDF Service");
  pdfDoc.setSubject(meta.subject);
  pdfDoc.setTitle(meta.title);

  setOutputIntent(pdfDoc);
  setMarkInfo(pdfDoc);
  setStructTreeRoot(pdfDoc);
  setXmpMetadata(pdfDoc, buildXmp(meta));
  await setTrailerId(pdfDoc, meta.documentId ?? meta.subject);

  // Save without object streams: PDF/A-3 with a classic xref table keeps every
  // object as plain text. This is required so the PAdES signer (node-signpdf)
  // can place its /ByteRange placeholder via string ops, and so validators can
  // read the PDF/A-3 markers uncompressed. PDF/A-2/3 permit uncompressed objects.
  return pdfDoc.save({ useObjectStreams: false });
}
