"use client";

import { Button } from "@rocky/ui/components/button";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { MovementDetail } from "#components/movements/movement-detail";
import { PageHeader } from "#components/shared/page-header";

export default function EditMovementPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Movement details"
        description="Read-only view — the movement API does not expose an update procedure."
        actions={
          <Button variant="ghost" onClick={() => router.push("/movements")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <MovementDetail id={params.id} />
    </div>
  );
}
