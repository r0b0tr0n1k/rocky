"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Building2,
  ClipboardCheck,
  PawPrint,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react";

import { useTRPC } from "#lib/trpc";
import type { AnimalSummary, MovementSummary } from "@rocky/validators/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rocky/ui/components/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@rocky/ui/components/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart as PieChartPrimitive, XAxis } from "recharts";

import { StatCard } from "@rocky/ui/components/stat-card";

const prettify = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

const colorVar = (i: number) => `var(--chart-${(i % 5) + 1})`;

export interface DashboardTotals {
  animals: number;
  farms: number;
  movements: number;
  inspections: number;
}

export function DashboardAnalytics({
  animals,
  movements,
  totals,
  isLoading,
}: {
  animals: AnimalSummary[];
  movements: MovementSummary[];
  totals: DashboardTotals;
  isLoading?: boolean;
}) {
  const statusCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const a of animals) map.set(a.status, (map.get(a.status) ?? 0) + 1);
    return Array.from(map, ([status, count]) => ({ status, count, label: prettify(status) }));
  }, [animals]);

  const sexCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const a of animals) map.set(a.sex, (map.get(a.sex) ?? 0) + 1);
    return Array.from(map, ([sex, count]) => ({ sex, count, label: prettify(sex) }));
  }, [animals]);

  const movementCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const m of movements) map.set(m.type, (map.get(m.type) ?? 0) + 1);
    return Array.from(map, ([type, count]) => ({ type, count, label: prettify(type) }));
  }, [movements]);

  const birthsByMonth = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const a of animals) {
      const d = new Date(a.birthDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map, ([month, count]) => ({
      month,
      count,
      label: new Date(`${month}-01`).toLocaleString("en", { month: "short", year: "2-digit" }),
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [animals]);

  const statusConfig = React.useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    statusCounts.forEach((s, i) => {
      cfg[s.status] = { label: s.label, color: colorVar(i) };
    });
    return cfg;
  }, [statusCounts]);

  const countConfig = (label: string, color: string): ChartConfig => ({ count: { label, color } });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Animals" value={totals.animals} hint="Registered cattle" icon={PawPrint} accent="primary" />
        <StatCard label="Farms" value={totals.farms} hint="Active holdings" icon={Building2} accent="emerald" />
        <StatCard label="Movements" value={totals.movements} hint="Recorded transfers" icon={ArrowLeftRight} accent="amber" />
        <StatCard label="Inspections" value={totals.inspections} hint="On-site visits" icon={ClipboardCheck} accent="violet" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-base">Births over time</CardTitle>
              <CardDescription>Animals by birth month</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={countConfig("Births", colorVar(2))} className="aspect-[16/9] w-full">
              <AreaChart data={birthsByMonth} margin={{ left: 4, right: 4 }}>
                <defs>
                  <linearGradient id="fillBirths" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="count"
                  type="natural"
                  fill="url(#fillBirths)"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <PieChart className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-base">Animal status</CardTitle>
              <CardDescription>Life-cycle distribution</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusConfig} className="mx-auto aspect-square max-h-[240px]">
              <PieChartPrimitive>
                <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
                <Pie data={statusCounts} dataKey="count" nameKey="status">
                  {statusCounts.map((s) => (
                    <Cell key={s.status} fill={`var(--color-${s.status})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="label" />} />
              </PieChartPrimitive>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Users className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-base">Animal sex</CardTitle>
              <CardDescription>Male vs female</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={countConfig("Animals", colorVar(0))} className="aspect-[4/3] w-full">
              <BarChart data={sexCounts} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-base">Movements by type</CardTitle>
              <CardDescription>Transfers, sales, slaughter & more</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={countConfig("Movements", colorVar(3))} className="aspect-[16/9] w-full">
              <BarChart data={movementCounts} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function useTotals() {
  const trpc = useTRPC();
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 1, offset: 0 }));
  const movements = useQuery(trpc.movement.list.queryOptions({ limit: 1, offset: 0 }));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 1, offset: 0 }));
  const inspections = useQuery(trpc.inspection.list.queryOptions({ limit: 1, offset: 0 }));

  return {
    animals: animals.data?.total ?? 0,
    farms: farms.data?.total ?? 0,
    movements: movements.data?.total ?? 0,
    inspections: inspections.data?.total ?? 0,
  };
}

export function useDashboardData() {
  const trpc = useTRPC();
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100, offset: 0 }));
  const movements = useQuery(trpc.movement.list.queryOptions({ limit: 100, offset: 0 }));
  const totals = useTotals();

  return {
    animals: (animals.data?.data ?? []) as AnimalSummary[],
    movements: (movements.data?.data ?? []) as MovementSummary[],
    totals,
    isLoading: animals.isLoading || movements.isLoading,
  };
}
