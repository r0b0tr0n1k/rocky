"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SubjectCreateForm } from "#components/subjects/subject-create-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent } from "@rocky/ui/components/card";

export default function NewSubjectPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New subject"
        description="Register a human agent."
        actions={
          <Button variant="ghost" onClick={() => router.push("/subjects")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <SubjectCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
