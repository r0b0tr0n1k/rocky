"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ArchiveDetail } from "#components/archive/archive-detail";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";

export default function EditArchivePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Archive document details"
        description="Read-only view — the archive API does not expose an update procedure. Use the actions to mark the document archived or destroyed."
        actions={
          <Button variant="ghost" onClick={() => router.push("/archive")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <ArchiveDetail id={params.id} />
    </div>
  );
}
