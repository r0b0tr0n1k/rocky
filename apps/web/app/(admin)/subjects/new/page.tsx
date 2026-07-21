"use client";

import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "#components/shared/page-header";
import { SubjectCreateForm } from "#components/subjects/subject-create-form";

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
