"use client";

import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { FarmCreateForm } from "#components/farms/farm-create-form";
import { PageHeader } from "#components/shared/page-header";

export default function NewFarmPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Register farm"
        description="Record a new farm holding."
        actions={
          <Button variant="ghost" onClick={() => router.push("/farms")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <FarmCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
