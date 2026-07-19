"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rocky/ui/components/card";

import { type DocumentResponse, documentGenerateRequestSchema } from "@rocky/validators/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { SelectField, TextField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { ValidatedForm } from "#components/shared/validated-form";
import { useTRPC } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

// ── Human-friendly labels for registered document types ────────────
const TYPE_LABELS: Record<string, string> = {
  movement: "Movement / Transport Declaration",
  passport: "Cattle Passport",
  "inspection-form": "Inspection Form",
  "ched-a": "CHED-A (Common Health Entry)",
  eudr: "EUDR Due Diligence Statement",
  "ear-tag": "Ear Tag Order",
};

/** Short description for the refId field per document type. */
const REFID_HINTS: Record<string, string> = {
  movement: "UUID of the movement record (e.g. from the Movements list)",
  passport: "UUID of the passport record",
  "inspection-form": "UUID of the inspection record",
  "ched-a": "UUID of the CHED-A notification",
  eudr: "UUID of the EUDR due diligence record",
  "ear-tag": "UUID of the ear tag order",
};

const FORMAT_OPTIONS = [
  { value: "yaml", label: "YAML — raw data view" },
  { value: "xml", label: "XML — structured export" },
  { value: "pdf", label: "PDF — signed PDF/A-3 (download)" },
];

export default function DocumentsPage() {
  const trpc = useTRPC();
  const searchParams = useSearchParams();
  const [result, setResult] = React.useState<DocumentResponse | null>(null);
  const [query, setQuery] = React.useState<{ type: string; refId: string } | null>(null);
  const submittedFromQuery = React.useRef(false);

  const types = useQuery(trpc.document.listTypes.queryOptions());
  const generate = useMutation(trpc.document.generate.mutationOptions({}));
  const signature = useQuery(
    trpc.document.verify.queryOptions(
      { type: query?.type ?? "", refId: query?.refId ?? "" },
      { enabled: !!query && !!result && result.format === "pdf" },
    ),
  );

  const form = useValidatedForm(documentGenerateRequestSchema, {
    defaultValues: { format: "pdf" },
  });

  const selectedType = form.watch("type");

  /** Build dropdown options from the registered types list. */
  const typeOptions = React.useMemo(() => {
    const data = types.data ?? [];
    if (data.length === 0) return [{ value: "", label: "No types available" }];
    return data.map((t) => ({
      value: t,
      label: TYPE_LABELS[t] ?? t,
    }));
  }, [types.data]);

  // Derive the object URL from result so there's no stale-state race.
  const pdfUrl = React.useMemo<string | null>(() => {
    if (!result || result.format !== "pdf") return null;
    const binary = atob(result.content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  }, [result]);

  // Revoke the previous blob URL when result changes.
  const prevResultRef = React.useRef<DocumentResponse | null>(null);
  React.useEffect(() => {
    const prev = prevResultRef.current;
    prevResultRef.current = result;
    if (prev && prev.format === "pdf" && prev !== result) {
      const binary = atob(prev.content);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const staleUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      URL.revokeObjectURL(staleUrl);
    }
  }, [result]);

  // Deep-link support: per-entity "Generate PDF" buttons land here with
  // ?type=&refId=&format= (format defaults to pdf). Prefill the form and
  // auto-generate once.
  React.useEffect(() => {
    const type = searchParams.get("type");
    const refId = searchParams.get("refId");
    const format = searchParams.get("format") ?? "pdf";
    if (type) form.setValue("type", type);
    if (refId) form.setValue("refId", refId);
    if (format === "yaml" || format === "xml" || format === "pdf") {
      form.setValue("format", format);
    }
    if (type && refId && !submittedFromQuery.current) {
      submittedFromQuery.current = true;
      const f = format as "yaml" | "xml" | "pdf";
      generate
        .mutateAsync({ type, refId, format: f })
        .then(setResult)
        .catch(() => {});
    }
  }, [searchParams, form, generate]);

  const onValid = async (values: { type: string; refId: string; format?: "yaml" | "xml" | "pdf" }) => {
    setQuery({ type: values.type, refId: values.refId });
    const res = await generate.mutateAsync(values);
    setResult(res);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Documents" description="Generate official documents from domain entities." />

      <Card>
        <CardHeader>
          <CardTitle>Generate a document</CardTitle>
          <CardDescription>Pick the document type, enter the entity UUID, and choose a format.</CardDescription>
        </CardHeader>
        <CardContent>
          <ValidatedForm form={form} onValid={onValid} submitting={generate.isPending} submitText="Generate">
            {types.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading document types…</p>
            ) : (
              <SelectField
                control={form.control}
                name="type"
                label="Document type"
                placeholder="Select a type…"
                options={typeOptions}
              />
            )}

            <TextField
              control={form.control}
              name="refId"
              label={selectedType && TYPE_LABELS[selectedType] ? `${TYPE_LABELS[selectedType]} — ID` : "Reference ID"}
              placeholder={
                selectedType
                  ? `Paste the ${selectedType} UUID here`
                  : "Select a document type first, then paste the UUID"
              }
            />

            {selectedType && REFID_HINTS[selectedType] ? (
              <p className="-mt-2 text-xs text-muted-foreground">{REFID_HINTS[selectedType]}</p>
            ) : null}

            <SelectField control={form.control} name="format" label="Format" options={FORMAT_OPTIONS} />
          </ValidatedForm>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>{result.documentName}</CardTitle>
            <CardDescription>
              {result.documentType} · {result.format} · v{result.modelVersion} · {result.generatedAt}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {result.format === "pdf" && signature.data ? (
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <p className="font-medium">
                  Signature:{" "}
                  <span className={signature.data.valid ? "text-green-700" : "text-red-700"}>
                    {signature.data.valid ? "VALID (PAdES-LTV)" : "INVALID"}
                  </span>
                </p>
                {signature.data.signerSubject ? <p>Signer: {signature.data.signerSubject}</p> : null}
                {signature.data.signedAt ? <p>Signed: {signature.data.signedAt}</p> : null}
                <p>
                  Timestamp: {signature.data.hasTimestamp ? "yes" : "no"} · Revocation data:{" "}
                  {signature.data.hasRevocation ? "yes" : "no"}
                </p>
              </div>
            ) : null}

            {result.format === "pdf" && pdfUrl ? (
              <>
                <a
                  href={pdfUrl}
                  download={`${result.documentType}-${query?.refId ?? "doc"}.pdf`}
                  className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Download PDF
                </a>
                <object data={pdfUrl} type="application/pdf" className="h-[640px] w-full rounded-md border bg-muted">
                  <p className="p-4 text-sm text-muted-foreground">
                    PDF preview unavailable in this browser. Use the Download button above.
                  </p>
                </object>
              </>
            ) : (
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{result.content}</pre>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
