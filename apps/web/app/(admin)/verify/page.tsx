"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rocky/ui/components/card";

import { documentVerifyRequestSchema } from "@rocky/validators/api";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { TextField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { ValidatedForm } from "#components/shared/validated-form";
import { useTRPC } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

/** Absolute URL a document QR should point at (the verify loop target). */
function verifyUrl(type: string, refId: string): string {
  if (typeof window === "undefined") {
    return `/verify?type=${encodeURIComponent(type)}&refId=${encodeURIComponent(refId)}`;
  }
  const u = new URL(`${window.location.origin}/verify`);
  u.searchParams.set("type", type);
  u.searchParams.set("refId", refId);
  return u.toString();
}

export default function VerifyPage() {
  const trpc = useTRPC();
  const searchParams = useSearchParams();
  const [params, setParams] = React.useState<{ type: string; refId: string } | null>(null);
  const [qr, setQr] = React.useState<string | null>(null);

  const verify = useQuery(
    trpc.document.verify.queryOptions(params!, { enabled: !!params }),
  );

  const form = useValidatedForm(documentVerifyRequestSchema, {
    defaultValues: {
      type: searchParams.get("type") ?? "",
      refId: searchParams.get("refId") ?? "",
    },
  });

  const onValid = (values: { type: string; refId: string }) => setParams(values);

  React.useEffect(() => {
    if (params && verify.data) {
      const url = verifyUrl(params.type, params.refId);
      QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, width: 240 })
        .then(setQr)
        .catch(() => setQr(null));
    }
  }, [params, verify.data]);

  const r = verify.data;

  // ── ADR-0084: verify a raw scanned credential QR string offline ──
  const [credQr, setCredQr] = React.useState("");
  const [credRun, setCredRun] = React.useState<string | null>(null);
  const verifyCred = useQuery(
    trpc.document.verifyCredential.queryOptions({ qr: credRun! }, { enabled: !!credRun }),
  );

  // ── ADR-0084 §4: surface credential status-list freshness ──
  const statusList = useQuery(trpc.document.statusList.queryOptions());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Verify document"
        description="Confirm the PAdES seal of a generated document by re-deriving and reading its signed PDF/A-3."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verify</CardTitle>
            <CardDescription>Enter the document type and reference id.</CardDescription>
          </CardHeader>
          <CardContent>
            <ValidatedForm form={form} onValid={onValid} submitText="Verify">
              <TextField control={form.control} name="type" label="Type" placeholder="e.g. inspection-form" />
              <TextField control={form.control} name="refId" label="Reference ID (UUID)" placeholder="entity uuid" />
            </ValidatedForm>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>Signature facts for the requested document.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {verify.isError ? (
              <p className="text-sm text-red-700">Verification failed: {verify.error?.message}</p>
            ) : null}
            {verify.isFetching ? <p className="text-sm text-muted-foreground">Verifying…</p> : null}
            {r ? (
              <>
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">
                    Signature:{" "}
                    <span className={r.valid ? "text-green-700" : "text-red-700"}>
                      {r.valid ? "VALID (PAdES-LTV)" : "INVALID"}
                    </span>
                  </p>
                  <p>Document: {r.documentType} · v{r.modelVersion}</p>
                  {r.signerSubject ? <p>Signer: {r.signerSubject}</p> : null}
                  {r.signerIssuer ? <p>Issuer: {r.signerIssuer}</p> : null}
                  {r.serialNumber ? <p>Serial: {r.serialNumber}</p> : null}
                  {r.algorithm ? <p>Algorithm: {r.algorithm}</p> : null}
                  {r.signedAt ? <p>Signed: {r.signedAt}</p> : null}
                  <p>
                    Timestamp: {r.hasTimestamp ? "yes" : "no"}
                    {r.timestampedAt ? ` (${r.timestampedAt})` : ""} · Revocation data:{" "}
                    {r.hasRevocation ? "yes" : "no"}
                  </p>
                  {r.message ? <p className="text-muted-foreground">Note: {r.message}</p> : null}
                </div>
                {qr ? (
                  <div className="flex flex-col items-start gap-2">
                    <img src={qr} alt="Document verify QR code" className="size-60 rounded-md border bg-white" />
                    <p className="text-xs text-muted-foreground">
                      Scan to open this verification at its canonical URL.
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No verification run yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Credential status list</CardTitle>
            <CardDescription>Revocation-state freshness for offline verification (ADR-0084 §4).</CardDescription>
          </CardHeader>
          <CardContent>
            {statusList.isError ? (
              <p className="text-sm text-red-700">Status list unavailable: {statusList.error?.message}</p>
            ) : statusList.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading status list…</p>
            ) : statusList.data ? (
              (() => {
                const list = statusList.data.list;
                const ageMs = Date.now() - new Date(list.issuedAt).getTime();
                const stale = ageMs > list.ttlSeconds * 1000;
                const days = Math.floor(ageMs / 86_400_000);
                return (
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <p className="font-medium">
                      Status list last synced:{" "}
                      <span className={stale ? "text-red-700" : "text-green-700"}>
                        {days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`}
                      </span>
                    </p>
                    <p>{list.entries.length} credentials tracked · publisher {list.publisher}</p>
                    <p className={stale ? "text-red-700" : "text-muted-foreground"}>
                      {stale
                        ? "STALE — re-sync the status list before trusting offline verification."
                        : "Fresh within the sync window."}
                    </p>
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-muted-foreground">No status list loaded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verify signed QR credential</CardTitle>
            <CardDescription>Paste a scanned credential QR string (ADR-0084).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <textarea
              className="min-h-24 w-full rounded-md border bg-muted/40 p-2 font-mono text-xs"
              placeholder="base64url CBOR envelope…"
              value={credQr}
              onChange={(e) => setCredQr(e.target.value)}
            />
            <button
              type="button"
              className="self-start rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
              disabled={!credQr.trim()}
              onClick={() => setCredRun(credQr.trim())}
            >
              Verify QR
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credential result</CardTitle>
            <CardDescription>Offline signature check against the pinned key.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {verifyCred.isError ? (
              <p className="text-sm text-red-700">Verification error: {verifyCred.error?.message}</p>
            ) : null}
            {verifyCred.isFetching ? <p className="text-sm text-muted-foreground">Verifying…</p> : null}
            {verifyCred.data ? (
              (() => {
                const c = verifyCred.data;
                return (
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <p className="font-medium">
                      Signature:{" "}
                      <span className={c.valid ? "text-green-700" : "text-red-700"}>
                        {c.valid ? "VALID" : "INVALID"}
                      </span>
                      {c.expired ? " · EXPIRED" : ""}
                    </p>
                    <p>Type: {c.payload.typ} · Subject: {c.payload.sub}</p>
                    {c.payload.farmId ? <p>Farm: {c.payload.farmId}</p> : null}
                    <p>Key id: {c.kid} · Alg: {c.algorithm}</p>
                    <p>
                      Issued: {new Date(c.payload.iat * 1000).toISOString()} · Expires:{}
                      {new Date(c.payload.exp * 1000).toISOString()}
                    </p>
                    <p>{c.message}</p>
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-muted-foreground">No credential verified yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
