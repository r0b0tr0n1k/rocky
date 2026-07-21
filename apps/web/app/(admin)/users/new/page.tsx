"use client";

import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "#components/shared/page-header";
import { UserCreateForm } from "#components/users/user-create-form";

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
