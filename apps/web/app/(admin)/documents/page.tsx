"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rocky/ui/components/card";

import { type DocumentResponse, documentGenerateRequestSchema } from "@rocky/validators/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as React from "react";
import { SelectField, TextField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { ValidatedForm } from "#components/shared/validated-form";
import { useTRPC } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

const FORMAT_OPTIONS = [
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
];

export default function DocumentsPage() {
  const trpc = useTRPC();
  const [result, setResult] = React.useState<DocumentResponse | null>(null);

  const types = useQuery(trpc.document.listTypes.queryOptions());
  const generate = useMutation(trpc.document.generate.mutationOptions({}));

  const form = useValidatedForm(documentGenerateRequestSchema, {
    defaultValues: { format: "yaml" },
  });

  const onValid = async (values: { type: string; refId: string; format?: "yaml" | "xml" }) => {
    const res = await generate.mutateAsync(values);
    setResult(res);
  };

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
            <CardDescription>Produce a YAML/XML document for a domain entity.</CardDescription>
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
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{result.content}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
