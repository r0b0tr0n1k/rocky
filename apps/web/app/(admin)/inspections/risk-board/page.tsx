"use client";

import { Badge } from "@rocky/ui/components/badge";
import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rocky/ui/components/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@rocky/ui/components/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@rocky/ui/components/field";
import { Input } from "@rocky/ui/components/input";
import { Skeleton } from "@rocky/ui/components/skeleton";
import { Switch } from "@rocky/ui/components/switch";
import { ToggleGroup, ToggleGroupItem } from "@rocky/ui/components/toggle-group";
import type { FarmResponse, InspectionResponse, UserSummary } from "@rocky/validators/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarRange, Check, CircleDot, Loader2, Plus, ShieldAlert, Tag } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { PageHeader } from "#components/shared/page-header";
import { StatusBadge } from "#components/shared/status-badge";
import { type Step, Stepper } from "#components/shared/stepper";
import { notifyError, notifySuccess } from "#lib/notify";
import { useCan } from "#lib/permissions";
import { useTRPC } from "#lib/trpc";

type Status = InspectionResponse["status"];

const STATUS_RANK: Record<Status, number> = {
  scheduled: 0,
  in_progress: 1,
  completed: 2,
  cancelled: 3,
};

const STATUS_LABEL: Record<Status, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function lifecycleSteps(status: Status): Step[] {
  const order: Status[] = ["scheduled", "in_progress", "completed"];
  const idx = status === "cancelled" ? -1 : order.indexOf(status);
  return order.map((s, i) => ({
    label: STATUS_LABEL[s],
    status:
      idx === -1
        ? "upcoming"
        : i < idx
          ? "done"
          : i === idx
            ? status === "completed"
              ? "done"
              : "current"
            : "upcoming",
  }));
}

function fmtDate(d?: string | null): string {
  if (!d) return "-";
  try {
    return format(parseISO(d), "d MMM yyyy");
  } catch {
    return "-";
  }
}

const FILTERS = [
  { value: "actionable", label: "Actionable" },
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];
export default function RiskBoardPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const year = new Date().getFullYear();

  const canReadAnalysis = useCan("analysis:read");
  const canRunAnalysis = useCan("analysis:run");

  const [filter, setFilter] = React.useState<FilterValue>("actionable");
  const [scheduling, setScheduling] = React.useState<InspectionResponse | null>(null);
  const [completing, setCompleting] = React.useState<InspectionResponse | null>(null);
  const [scheduleDate, setScheduleDate] = React.useState("");
  const [completeDate, setCompleteDate] = React.useState("");
  const [completeResult, setCompleteResult] = React.useState("");
  const [discrepancies, setDiscrepancies] = React.useState(false);
  const [keeperSigned, setKeeperSigned] = React.useState(false);

  const listQuery = useQuery(trpc.inspection.list.queryOptions({ limit: 100, offset: 0 }));
  const farmsQuery = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const usersQuery = useQuery(trpc.user.list.queryOptions({ limit: 100 }));
  const analysisQuery = useQuery({
    ...trpc.inspection.listRiskAnalyses.queryOptions({ year, limit: 1 }),
    enabled: canReadAnalysis,
  });

  const rows = (listQuery.data?.data ?? []) as InspectionResponse[];
  const latest = analysisQuery.data?.data?.[0];

  const farmMap = React.useMemo(() => {
    const m = new Map<string, FarmResponse>();
    ((farmsQuery.data?.data ?? []) as FarmResponse[]).forEach((f) => {
      m.set(f.id, f);
    });
    return m;
  }, [farmsQuery.data]);

  const userMap = React.useMemo(() => {
    const m = new Map<string, UserSummary>();
    ((usersQuery.data ?? []) as UserSummary[]).forEach((u) => {
      m.set(u.id, u);
    });
    return m;
  }, [usersQuery.data]);
  const farmLabel = React.useCallback(
    (id: string) => {
      const f = farmMap.get(id);
      return f ? `${f.farmId} - ${f.name}` : id;
    },
    [farmMap],
  );

  const inspectorLabel = React.useCallback(
    (id: string) => {
      const u = userMap.get(id);
      const name = u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "";
      return name || u?.username || id;
    },
    [userMap],
  );

  const visible = React.useMemo(() => {
    let list = [...rows];
    if (filter === "actionable") {
      list = list.filter((r) => r.status === "scheduled" || r.status === "in_progress");
    } else if (filter !== "all") {
      list = list.filter((r) => r.status === filter);
    }
    list.sort((a, b) => {
      const r = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (r !== 0) return r;
      return (a.scheduledDate ?? "9999").localeCompare(b.scheduledDate ?? "9999");
    });
    return list;
  }, [rows, filter]);

  const attention = React.useMemo(
    () => rows.filter((r) => r.discrepanciesFound || r.selectedByRiskAnalysis).slice(0, 6),
    [rows],
  );

  const invalidateList = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: trpc.inspection.list.queryKey() }),
    [queryClient, trpc],
  );
  const invalidateAnalysis = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: trpc.inspection.listRiskAnalyses.queryKey() }),
    [queryClient, trpc],
  );
  const runMutation = useMutation(
    trpc.inspection.runRiskAnalysis.mutationOptions({
      onSuccess: (data) => {
        notifySuccess(`${data.selectedFarmCount} of ${data.totalFarmCount} farms selected for ${year}.`);
        invalidateAnalysis();
        invalidateList();
      },
      onError: (e) => notifyError(e, "Could not run risk analysis."),
    }),
  );

  const scheduleMutation = useMutation(
    trpc.inspection.schedule.mutationOptions({
      onSuccess: () => {
        notifySuccess("Inspection scheduled.");
        invalidateList();
        setScheduling(null);
        setScheduleDate("");
      },
      onError: (e) => notifyError(e, "Could not schedule inspection."),
    }),
  );

  const completeMutation = useMutation(
    trpc.inspection.complete.mutationOptions({
      onSuccess: () => {
        notifySuccess("Inspection completed.");
        invalidateList();
        setCompleting(null);
        setCompleteDate("");
        setCompleteResult("");
        setDiscrepancies(false);
        setKeeperSigned(false);
      },
      onError: (e) => notifyError(e, "Could not complete inspection."),
    }),
  );

  // HERO: the statutory 1-in-N selection rate (characteristic number in this domain)
  const selectionPct = latest?.selectionPercentage ?? 10;
  const per = Math.max(1, Math.round(100 / (selectionPct || 10)));
  const dots = Math.min(per, 12);
  const dotKeys = Array.from({ length: dots }, (_, i) => `dot-${i}`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Risk board"
        description="Statutory farm selection and the inspections that need your decision today."
        actions={
          <>
            {canRunAnalysis ? (
              <Button variant="default" disabled={runMutation.isPending} onClick={() => runMutation.mutate({ year })}>
                {runMutation.isPending ? <Loader2 className="animate-spin" /> : <CalendarRange />}
                Run risk analysis
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/inspections/new">
                <Plus />
                New inspection
              </Link>
            </Button>
          </>
        }
      />
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Statutory programme - {year} cycle
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">1</span>
              <span className="text-4xl font-semibold tracking-tight text-muted-foreground">in</span>
              <span className="text-4xl font-semibold tracking-tight tabular-nums">{per}</span>
              <span className="text-sm text-muted-foreground">farms</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {latest
                ? `${latest.selectedFarms} of ${latest.totalFarms} farms selected for on-spot inspection.`
                : "No analysis run for this cycle yet."}
            </p>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {dotKeys.map((k) => (
              <span
                key={k}
                className={k === "dot-0" ? "size-4 rounded-full bg-accent" : "size-4 rounded-full bg-border"}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Inspection queue</h2>
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(v) => v && setFilter(v as FilterValue)}
              variant="outline"
              size="sm"
            >
              {FILTERS.map((f) => (
                <ToggleGroupItem key={f.value} value={f.value}>
                  {f.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {listQuery.isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : visible.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleDot />
                </EmptyMedia>
                <EmptyTitle>No inspections here</EmptyTitle>
                <EmptyDescription>
                  Nothing matches this filter. Start a new on-spot inspection or run the risk analysis to populate the
                  queue.
                </EmptyDescription>
              </EmptyHeader>
              <Button asChild variant="outline" size="sm">
                <Link href="/inspections/new">
                  <Plus />
                  New inspection
                </Link>
              </Button>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {visible.slice(0, 8).map((insp) => (
                <InspectionCard
                  key={insp.id}
                  inspection={insp}
                  farmLabel={farmLabel}
                  inspectorLabel={inspectorLabel}
                  onSchedule={setScheduling}
                  onComplete={setCompleting}
                />
              ))}
              {visible.length > 8 ? (
                <Button asChild variant="ghost" size="sm" className="self-start">
                  <Link href="/inspections">View all {visible.length} inspections</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <ShieldAlert className="size-4 text-destructive" />
            Needs attention
          </h2>
          {attention.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                No discrepancies or risk-selected farms pending review.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {attention.map((insp) => (
                <Card key={insp.id}>
                  <CardContent className="flex flex-col gap-1 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm">{farmLabel(insp.farmId)}</span>
                      <StatusBadge value={insp.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {insp.selectedByRiskAnalysis ? (
                        <Badge className="bg-accent text-accent-foreground">Risk-selected</Badge>
                      ) : null}
                      {insp.discrepanciesFound ? <Badge variant="destructive">Discrepancy</Badge> : null}
                      {insp.riskScore ? <Badge variant="outline">Score {insp.riskScore}</Badge> : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Dialog open={!!scheduling} onOpenChange={(o) => !o && setScheduling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule inspection</DialogTitle>
            <DialogDescription>
              Set the on-spot date for {scheduling ? farmLabel(scheduling.farmId) : ""}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="schedule-date">Scheduled date</FieldLabel>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
              <FieldDescription>The vet will be assigned the on-spot visit.</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setScheduling(null)}>
              Cancel
            </Button>
            <Button
              disabled={!scheduleDate || scheduleMutation.isPending}
              onClick={() =>
                scheduling &&
                scheduleMutation.mutate({
                  id: scheduling.id,
                  scheduledDate: scheduleDate,
                })
              }
            >
              {scheduleMutation.isPending ? <Loader2 className="animate-spin" /> : <CalendarRange />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!completing} onOpenChange={(o) => !o && setCompleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete inspection</DialogTitle>
            <DialogDescription>
              Record the outcome for {completing ? farmLabel(completing.farmId) : ""}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="complete-date">Inspection date</FieldLabel>
              <Input
                id="complete-date"
                type="date"
                value={completeDate}
                onChange={(e) => setCompleteDate(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="complete-result">Result</FieldLabel>
              <Input
                id="complete-result"
                placeholder="e.g. compliant"
                value={completeResult}
                onChange={(e) => setCompleteResult(e.target.value)}
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="discrepancies">Discrepancies found</FieldLabel>
                <Switch id="discrepancies" checked={discrepancies} onCheckedChange={setDiscrepancies} />
              </div>
            </Field>
            <Field>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="keeper-signed">Keeper signed</FieldLabel>
                <Switch id="keeper-signed" checked={keeperSigned} onCheckedChange={setKeeperSigned} />
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCompleting(null)}>
              Cancel
            </Button>
            <Button
              disabled={!completeDate || completeMutation.isPending}
              onClick={() =>
                completing &&
                completeMutation.mutate({
                  id: completing.id,
                  inspectionDate: completeDate,
                  result: completeResult || undefined,
                  discrepanciesFound: discrepancies,
                  keeperSigned,
                })
              }
            >
              {completeMutation.isPending ? <Loader2 className="animate-spin" /> : <Check />}
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
interface InspectionCardProps {
  inspection: InspectionResponse;
  farmLabel: (id: string) => string;
  inspectorLabel: (id: string) => string;
  onSchedule: (i: InspectionResponse) => void;
  onComplete: (i: InspectionResponse) => void;
}

function InspectionCard({ inspection, farmLabel, inspectorLabel, onSchedule, onComplete }: InspectionCardProps) {
  const isActionable = inspection.status === "scheduled" || inspection.status === "in_progress";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <Tag className="size-4 shrink-0 text-accent" />
            <span className="truncate font-mono text-sm">{farmLabel(inspection.farmId)}</span>
            <StatusBadge value={inspection.status} />
            {inspection.selectedByRiskAnalysis ? (
              <Badge className="bg-accent text-accent-foreground">Risk-selected</Badge>
            ) : null}
          </div>
          <Stepper steps={lifecycleSteps(inspection.status)} orientation="horizontal" className="w-full max-w-xs" />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {STATUS_LABEL[inspection.status]}
              {inspection.scheduledDate ? ` - ${fmtDate(inspection.scheduledDate)}` : ""}
            </span>
            <span>VI: {inspectorLabel(inspection.inspectorId)}</span>
            {inspection.discrepanciesFound ? <span className="text-destructive">Discrepancy flagged</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {inspection.status === "scheduled" ? (
            <Button size="sm" variant="default" onClick={() => onSchedule(inspection)}>
              <CalendarRange />
              Schedule
            </Button>
          ) : null}
          {inspection.status === "in_progress" ? (
            <Button size="sm" variant="default" onClick={() => onComplete(inspection)}>
              <Check />
              Complete
            </Button>
          ) : null}
          {inspection.status === "completed" ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/inspections/${inspection.id}`}>View form</Link>
            </Button>
          ) : null}
          {inspection.status === "cancelled" ? (
            <Button asChild size="sm" variant="ghost">
              <Link href={`/inspections/${inspection.id}`}>View</Link>
            </Button>
          ) : null}
          {!isActionable ? (
            <Button asChild size="sm" variant="ghost">
              <Link href={`/inspections/${inspection.id}`}>Open</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
