"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DeviceCreateForm } from "#components/devices/device-create-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";

export default function NewDevicePage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Register device"
        description="Add a field PDA device."
        actions={
          <Button variant="ghost" onClick={() => router.push("/devices")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <DeviceCreateForm />
    </div>
  );
}
