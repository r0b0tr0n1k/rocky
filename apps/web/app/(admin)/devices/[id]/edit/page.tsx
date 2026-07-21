"use client";

import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { DeviceEditForm } from "#components/devices/device-edit-form";
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
      <Card>
        <CardContent className="p-6">
          <DeviceEditForm id={params.id} />
        </CardContent>
      </Card>
    </div>
  );
}
