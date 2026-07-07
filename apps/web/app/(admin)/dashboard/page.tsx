"use client";

import * as React from "react";
import Link from "next/link";

import { animalColumns, type AnimalRow } from "#components/animals/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rocky/ui/components/card";
import { navSections } from "#lib/nav-config";
import { trpc } from "#lib/trpc";

export default function DashboardPage() {
  const listQuery = trpc.animal.list.useQuery({ limit: 5, offset: 0 });
  const rows = (listQuery.data?.data ?? []) as AnimalRow[];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Cattle registration & movement control centre." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {navSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription>{section.items.length} modules</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-accent"
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {item.title}
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Recently registered</h2>
        <DataTable columns={animalColumns} data={rows} total={rows.length} isLoading={listQuery.isLoading} />
      </div>
    </div>
  );
}
