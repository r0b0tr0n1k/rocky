"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { MovementCreateForm } from "#components/movements/movement-create-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent } from "@rocky/ui/components/card";

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
