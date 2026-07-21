"use client";

import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { AnimalEditForm } from "#components/animals/animal-edit-form";
import { PageHeader } from "#components/shared/page-header";

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
