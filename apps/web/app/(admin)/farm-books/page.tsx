"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rocky/ui/components/select";

import { Badge } from "@rocky/ui/components/badge";
import { Button } from "@rocky/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rocky/ui/components/dialog";
import {
  createFarmBookRequestSchema,
  updateFarmBookStatusRequestSchema,
  type FarmBookResponse,
  type FarmSummary,
} from "@rocky/validators/api";
import { FARM_BOOK_STATUS, type farmBookStatusType } from "@rocky/validators/enums";
import { ActionDialog } from "#components/shared/action-dialog";
import { ComboboxField, SelectField, TextField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { Stepper } from "#components/shared/stepper";
import { DataTable } from "#components/shared/data-table";
import { farmBookColumns } from "#components/farm-books/columns";
import { useTRPC } from "#lib/trpc";

// Imported enum — drives the lifecycle Stepper AND the status <select>.
const FARM_BOOK_STATUS_ORDER = Object.values(FARM_BOOK_STATUS);

function statusStep(
  s: farmBookStatusType,
  current: farmBookStatusType,
): "done" | "current" | "upcoming" {
  const curIdx = FARM_BOOK_STATUS_ORDER.indexOf(current);
  const idx = FARM_BOOK_STATUS_ORDER.indexOf(s);
  if (s === current) return "current";
  return idx < curIdx ? "done" : "upcoming";
}

// Full tRPC input ({ id, data: { status, vsId? } }) so ActionDialog can
// submit directly to updateStatus.mutate without a hand-rolled wrapper.
const updateStatusFormSchema = z.strictObject({
  id: z.uuid(),
  data: updateFarmBookStatusRequestSchema,
});

export default function FarmBooksPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [farmId, setFarmId] = React.useState<string | undefined>(undefined);
  const [selected, setSelected] = React.useState<FarmBookResponse | null>(null);

  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100, offset: 0 }));
  const farmOptions = ((farms.data?.data ?? []) as FarmSummary[]).map((f) => ({
    value: f.id,
    label: f.name ?? f.farmId,
  }));

  const listQuery = useQuery(
    trpc.farmBook.getByFarmId.queryOptions({ farmId: farmId ?? "" }, { enabled: !!farmId }),
  );
  const rows = (listQuery.data ?? []) as FarmBookResponse[];

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.farmBook.getByFarmId.queryKey({ farmId: farmId ?? "" }),
    });

  const create = useMutation(trpc.farmBook.create.mutationOptions({ onSuccess: invalidate }));
  const updateStatus = useMutation(
    trpc.farmBook.updateStatus.mutationOptions({ onSuccess: invalidate }),
  );

  const columns = React.useMemo(() => farmBookColumns({ onView: setSelected }), []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Farm Books"
        description="Physical farm-book documents and their production lifecycle."
        actions={
          <ActionDialog
            as="button"
            triggerLabel="New farm book"
            icon={Plus}
            schema={createFarmBookRequestSchema}
            mutation={create}
            title="New farm book"
            description="Registers a new physical farm book for a farm."
            fields={(form) => (
              <ComboboxField
                control={form.control}
                name="farmId"
                label="Farm"
                options={farmOptions}
                placeholder="Select a farm"
              />
            )}
          />
        }
      />

      <Select value={farmId ?? "all"} onValueChange={(v) => setFarmId(v === "all" ? undefined : v)}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a farm…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All farms</SelectItem>
          {farmOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DataTable
        columns={columns}
        data={rows}
        total={rows.length}
        isLoading={listQuery.isLoading}
        page={0}
        pageSize={Math.max(rows.length, 20)}
        onPageChange={() => {}}
      />

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected ? (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Farm Book</DialogTitle>
              <DialogDescription>Farm: {selected.farmId}</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className="capitalize">{selected.status}</Badge>
            </div>

            <Stepper
              steps={FARM_BOOK_STATUS_ORDER.map((s) => ({
                label: s,
                status: statusStep(s, selected.status),
              }))}
              orientation="horizontal"
            />

            <div className="flex justify-end">
              <ActionDialog
                key={selected.id}
                as="button"
                triggerLabel="Update status"
                schema={updateStatusFormSchema}
                mutation={updateStatus}
                defaultValues={{ id: selected.id, data: { status: selected.status } }}
                title="Update farm book status"
                description="Advances the farm book through its production lifecycle."
                fields={(form) => (
                  <>
                    <SelectField
                      control={form.control}
                      name="data.status"
                      label="Status"
                      options={FARM_BOOK_STATUS_ORDER.map((s) => ({ label: s, value: s }))}
                    />
                    <TextField
                      control={form.control}
                      name="data.vsId"
                      label="VS ID (optional)"
                      placeholder="uuid"
                    />
                  </>
                )}
              />
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
