"use client";

import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { InspectionCreateForm } from "#components/inspections/inspection-create-form";
import { PageHeader } from "#components/shared/page-header";

export default function NewInspectionPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New inspection"
        description="Schedule an on-spot inspection for a farm."
        actions={
          <Button variant="ghost" onClick={() => router.push("/inspections")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <InspectionCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
