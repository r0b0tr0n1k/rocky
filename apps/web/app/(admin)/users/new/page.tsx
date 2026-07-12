"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { UserCreateForm } from "#components/users/user-create-form";
import { Button } from "@rocky/ui/components/button";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent } from "@rocky/ui/components/card";

export default function NewUserPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New user"
        description="Create a System Management account."
        actions={
          <Button variant="ghost" onClick={() => router.push("/users")}>
            <ArrowLeft /> Back
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <UserCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
