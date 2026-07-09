"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DeviceEditForm } from "#components/devices/device-edit-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";

export default function EditDevicePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit device"
        description="Update device details."
        actions={
          <Button variant="ghost" onClick={() => router.push("/devices")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <DeviceEditForm id={params.id} />
    </div>
  );
}
