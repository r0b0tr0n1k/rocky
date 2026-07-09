"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SubjectEditForm } from "#components/subjects/subject-edit-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";

export default function EditSubjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit subject"
        description="Update subject details."
        actions={
          <Button variant="ghost" onClick={() => router.push("/subjects")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <SubjectEditForm id={params.id} />
    </div>
  );
}
