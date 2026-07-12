"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { UserEditForm } from "#components/users/user-edit-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent } from "@rocky/ui/components/card";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit user"
        description="Update account details."
        actions={
          <Button variant="ghost" onClick={() => router.push("/users")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <UserEditForm id={params.id} />
        </CardContent>
      </Card>
    </div>
  );
}
