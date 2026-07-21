"use client";

import { Button } from "@rocky/ui/components/button";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { InspectionDetail } from "#components/inspections/inspection-detail";
import { PageHeader } from "#components/shared/page-header";

export default function EditInspectionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inspection details"
        description="Read-only view — the inspection API does not expose an update procedure. Use the actions to schedule, complete, or print the form."
        actions={
          <Button variant="ghost" onClick={() => router.push("/inspections")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <InspectionDetail id={params.id} />
    </div>
  );
}
