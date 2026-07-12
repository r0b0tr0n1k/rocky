"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AnimalCreateForm } from "#components/animals/animal-create-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent } from "@rocky/ui/components/card";

export default function NewAnimalPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Register animal"
        description="Record a new cattle registration."
        actions={
          <Button variant="ghost" onClick={() => router.push("/animals")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <AnimalCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
