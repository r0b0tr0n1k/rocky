"use client";

import { Badge } from "@rocky/ui/components/badge";
import { Button } from "@rocky/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@rocky/ui/components/dialog";
import { FieldGroup } from "@rocky/ui/components/field";
import { type SystemParameterResponse, updateSystemParameterSchema } from "@rocky/validators/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import * as React from "react";
import { DataTable } from "#components/shared/data-table";
import { SwitchField, TextField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { TableCard, tableDensityClass } from "#components/shared/table-card";
import { ValidatedForm } from "#components/shared/validated-form";
import { useCan } from "#lib/permissions";
import { useTRPC } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

export default function SystemParametersPage() {
  const trpc = useTRPC();
  const canWrite = useCan("sm:sysparams:write");

  const listQuery = useQuery(trpc.systemParameters.list.queryOptions({ limit: 100, offset: 0 }));
  const rows = (listQuery.data?.data ?? []) as SystemParameterResponse[];

  const columns: ColumnDef<SystemParameterResponse>[] = [
    { accessorKey: "code", header: "Code", enableSorting: false },
    {
      accessorKey: "description",
      header: "Description",
      enableSorting: false,
      cell: ({ row }) => row.original.description ?? "—",
    },
    {
      accessorKey: "value",
      header: "Value",
      enableSorting: false,
      cell: ({ row }) => <code className="rounded bg-muted px-1 py-0.5 text-xs">{row.original.value}</code>,
    },
    {
      accessorKey: "isActive",
      header: "Active",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isActive ? <Badge variant="secondary">Yes</Badge> : <Badge variant="destructive">No</Badge>,
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      enableSorting: false,
      cell: ({ row }) => (row.original.updatedAt ? format(new Date(row.original.updatedAt), "PP") : "—"),
    },
  ];

  if (canWrite) {
    columns.push({
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => <EditParameterDialog param={row.original} />,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="System Parameters" description="Editable software configuration values." />
      <TableCard>
        <DataTable
          columns={columns}
          data={rows}
          total={rows.length}
          isLoading={listQuery.isLoading}
          page={0}
          pageSize={100}
          bordered={false}
          tableClassName={tableDensityClass}
        />
      </TableCard>
    </div>
  );
}

function EditParameterDialog({ param }: { param: SystemParameterResponse }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const form = useValidatedForm(updateSystemParameterSchema, {
    defaultValues: { value: param.value, isActive: param.isActive },
  });
  const update = useMutation(
    trpc.systemParameters.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.systemParameters.list.queryKey() });
        setOpen(false);
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <DialogContent className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{`Edit ${param.code}`}</DialogTitle>
          {param.description ? <DialogDescription>{param.description}</DialogDescription> : null}
        </DialogHeader>
        <ValidatedForm
          form={form}
          submitting={update.isPending}
          onValid={(values) => update.mutate({ code: param.code, data: values })}
          submitText="Save"
        >
          <FieldGroup>
            <TextField control={form.control} name="value" label="Value" />
            <SwitchField control={form.control} name="isActive" label="Active" />
          </FieldGroup>
        </ValidatedForm>
      </DialogContent>
    </Dialog>
  );
}
