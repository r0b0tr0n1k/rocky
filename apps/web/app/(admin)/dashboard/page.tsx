"use client";

import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

import { animalColumns } from "#components/animals/columns";
import { DataTable } from "#components/shared/data-table";
import { Seal } from "#components/shared/seal";
import { DashboardAnalytics, useDashboardData } from "#components/dashboard/analytics";
import { authClient } from "#lib/auth-client";
import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";

function formatToday(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function DashboardPage() {
  const { animals, movements, totals, isLoading } = useDashboardData();
  const recent = animals.slice(0, 5);
  const { data: session } = authClient.useSession();
  const name = session?.user?.name ?? "there";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-brass/40 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="text-seal" aria-hidden>
            <Seal variant="filled" className="size-7" />
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Livestock Registry</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                Live
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Officer {name} · North Macedonia · {formatToday(new Date())}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/animals/new">
              <Plus />
              Register animal
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/inspections/new">
              <CalendarDays />
              New inspection
            </Link>
          </Button>
        </div>
      </div>

      <DashboardAnalytics animals={animals} movements={movements} totals={totals} isLoading={isLoading} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-seal" aria-hidden>
              <Seal variant="open" className="size-4" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight">Recently registered</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/animals">View all</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <DataTable columns={animalColumns} data={recent} total={recent.length} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
