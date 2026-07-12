"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SubjectEditForm } from "#components/subjects/subject-edit-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent } from "@rocky/ui/components/card";

export default function EditSubjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit subject"
        description="Update human-agent details."
        actions={
          <Button variant="ghost" onClick={() => router.push("/subjects")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <SubjectEditForm id={params.id} />
        </CardContent>
      </Card>
    </div>
  );
}
