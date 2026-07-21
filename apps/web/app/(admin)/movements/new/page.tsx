"use client";

import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { MovementCreateForm } from "#components/movements/movement-create-form";
import { PageHeader } from "#components/shared/page-header";

export default function NewMovementPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Record movement"
        description="Create a new livestock movement."
        actions={
          <Button variant="ghost" onClick={() => router.push("/movements")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <MovementCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
