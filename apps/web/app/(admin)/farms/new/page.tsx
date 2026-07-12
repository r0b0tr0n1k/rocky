"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FarmCreateForm } from "#components/farms/farm-create-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent } from "@rocky/ui/components/card";

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
