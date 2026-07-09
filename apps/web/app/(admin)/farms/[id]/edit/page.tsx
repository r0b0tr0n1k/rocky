"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FarmEditForm } from "#components/farms/farm-edit-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";

export default function EditFarmPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit farm"
        description="Update farm details."
        actions={
          <Button variant="ghost" onClick={() => router.push("/farms")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <FarmEditForm id={params.id} />
    </div>
  );
}
