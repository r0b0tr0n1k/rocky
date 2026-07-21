"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@rocky/ui/components/breadcrumb";
import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";
import { CalendarDays, MapPin, Plus, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { animalColumns } from "#components/animals/columns";
import { DashboardAnalytics, useDashboardData } from "#components/dashboard/analytics";
import { DashboardStat } from "#components/dashboard/stat-tile";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { Seal } from "#components/shared/seal";
import { authClient } from "#lib/auth-client";

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
      <PageHeader
        eyebrow="Dashboard"
        title="Livestock Registry"
        description={`Officer ${name} · North Macedonia · ${formatToday(new Date())}`}
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Livestock Registry</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        status={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Live
          </span>
        }
        actions={
          <>
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
          </>
        }
      />

      <DashboardAnalytics animals={animals} movements={movements} totals={totals} isLoading={isLoading} />

      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardStat
          label="Active disease zones"
          value={totals.activeDiseaseZones}
          hint="Open geo restrictions"
          icon={ShieldAlert}
          href="/geo"
        />
        <DashboardStat
          label="Open geofence events"
          value={totals.openGeofenceEvents}
          hint="Events in last 30 days"
          icon={MapPin}
          href="/geo"
        />
      </div>

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
