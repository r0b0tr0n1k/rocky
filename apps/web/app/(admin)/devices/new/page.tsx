"use client";

import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeviceCreateForm } from "#components/devices/device-create-form";
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
      <Card>
        <CardContent className="p-6">
          <DeviceCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
