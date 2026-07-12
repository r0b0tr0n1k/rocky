"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ArchiveCreateForm } from "#components/archive/archive-create-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent } from "@rocky/ui/components/card";

export default function NewArchivePage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Archive document"
        description="Register a document into the 3-tier archive."
        actions={
          <Button variant="ghost" onClick={() => router.push("/archive")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <ArchiveCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
