"use client";

import { Button } from "@rocky/ui/components/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { OrganizationCreateForm } from "#components/organizations/organization-create-form";
import { PageHeader } from "#components/shared/page-header";

export default function NewOrganizationPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New organization"
        description="Register an administrative unit."
        actions={
          <Button variant="ghost" onClick={() => router.push("/organizations")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <OrganizationCreateForm />
    </div>
  );
}
