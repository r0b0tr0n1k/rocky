"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AnimalEditForm } from "#components/animals/animal-edit-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent } from "@rocky/ui/components/card";

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit animal"
        description="Update registration details."
        actions={
          <Button variant="ghost" onClick={() => router.push("/animals")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <AnimalEditForm id={params.id} />
        </CardContent>
      </Card>
    </div>
  );
}
