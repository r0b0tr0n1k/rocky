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

const FORMAT_OPTIONS = [
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "pdf", label: "PDF (signed PDF/A-3)" },
];

/** Decode a base64 PDF/A-3 response into an object URL for download/preview. */
function pdfObjectUrl(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
}

export default function DocumentsPage() {
  const trpc = useTRPC();
  const searchParams = useSearchParams();
  const [result, setResult] = React.useState<DocumentResponse | null>(null);
  const [query, setQuery] = React.useState<{ type: string; refId: string } | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const submittedFromQuery = React.useRef(false);

  const types = useQuery(trpc.document.listTypes.queryOptions());
  const generate = useMutation(trpc.document.generate.mutationOptions({}));
  const signature = useQuery(
    trpc.document.verify.queryOptions(
      { type: query!.type, refId: query!.refId },
      { enabled: !!query && !!result && result.format === "pdf" },
    ),
  );

  const form = useValidatedForm(documentGenerateRequestSchema, {
    defaultValues: { format: "yaml" },
  });

  // Deep-link support: per-entity "Generate PDF" buttons land here with
  // ?type=&refId=. Prefill the form and auto-generate once.
  React.useEffect(() => {
    const type = searchParams.get("type");
    const refId = searchParams.get("refId");
    if (type) form.setValue("type", type);
    if (refId) form.setValue("refId", refId);
    if (type && refId && !submittedFromQuery.current) {
      submittedFromQuery.current = true;
      generate.mutateAsync({ type, refId, format: "pdf" }).then(setResult).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const onValid = async (values: { type: string; refId: string; format?: "yaml" | "xml" | "pdf" }) => {
    setQuery({ type: values.type, refId: values.refId });
    const res = await generate.mutateAsync(values);
    setResult(res);
    if (res.format === "pdf") {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(pdfObjectUrl(res.content));
    } else if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  React.useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Documents" description="Generate official documents from domain entities." />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Available types</CardTitle>
            <CardDescription>Document templates registered in the PDF service.</CardDescription>
          </CardHeader>
          <CardContent>
            {types.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (types.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No document types registered.</p>
            ) : (
              <ul className="list-inside list-disc text-sm">
                {(types.data ?? []).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate</CardTitle>
            <CardDescription>Produce a YAML / XML / signed PDF/A-3 document for a domain entity.</CardDescription>
          </CardHeader>
          <CardContent>
            <ValidatedForm form={form} onValid={onValid} submitting={generate.isPending} submitText="Generate">
              <TextField control={form.control} name="type" label="Type" placeholder="e.g. inspection-form" />
              <TextField control={form.control} name="refId" label="Reference ID (UUID)" placeholder="entity uuid" />
              <SelectField control={form.control} name="format" label="Format" options={FORMAT_OPTIONS} />
            </ValidatedForm>
          </CardContent>
        </Card>
      </div>

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
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="h-[640px] w-full rounded-md border bg-muted"
                >
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
