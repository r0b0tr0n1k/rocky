"use client";

import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

import { animalColumns } from "#components/animals/columns";
import { DataTable } from "#components/shared/data-table";
import { DashboardAnalytics, useDashboardData } from "#components/dashboard/analytics";
import { authClient } from "#lib/auth-client";
import { Button } from "@rocky/ui/components/button";

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
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Welcome back, {name}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Operations overview</h1>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live · {formatToday(new Date())}
            </p>
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
      </div>

      <DashboardAnalytics animals={animals} movements={movements} totals={totals} isLoading={isLoading} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recently registered</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/animals">View all</Link>
          </Button>
        </div>
        <DataTable columns={animalColumns} data={recent} total={recent.length} isLoading={isLoading} />
      </div>
    </div>
  );
}
