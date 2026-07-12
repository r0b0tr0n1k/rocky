"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@rocky/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@rocky/ui/components/dialog";
import { DropdownMenuItem } from "@rocky/ui/components/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rocky/ui/components/select";
import { organizationColumns, type OrganizationSummary } from "#components/organizations/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { RowActionMenu } from "#components/shared/action-dialog";
import { TableCard, tableDensityClass, appendRowActions } from "#components/shared/table-card";
import { useTRPC } from "#lib/trpc";
import { enumToOptions } from "#lib/options";
import { ORG_TYPE } from "@rocky/validators/enums";
import { type OrganizationResponse } from "@rocky/validators/api";

export default function OrganizationsPage() {
  const router = useRouter();
  const trpc = useTRPC();

  // organization.list has no input and returns a bare array (no total) — no pager.
  // Type filter switches to listByType (wires that procedure).
  const [orgType, setOrgType] = React.useState<string>("all");
  const listQuery = useQuery(
    orgType === "all"
      ? trpc.organization.list.queryOptions()
      : trpc.organization.listByType.queryOptions({ orgType }),
  );
  const rows = (listQuery.data ?? []) as OrganizationSummary[];
  const orgsMap = Object.fromEntries(rows.map((o) => [o.id, o.name1]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Organizations"
        description="Veterinary Directorate administrative units."
      />
      <TableCard
        toolbarLeft={
          <Select value={orgType} onValueChange={setOrgType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {enumToOptions(Object.values(ORG_TYPE)).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        action={
          <Button onClick={() => router.push("/organizations/new")}>
            <Plus /> New organization
          </Button>
        }
      >
        <DataTable
          columns={appendRowActions(organizationColumns(orgsMap), (row) => (
            <RowActionMenu
              items={[
                {
                  type: "dialog",
                  dialog: (
                    <OrganizationDetails
                      org={row}
                      orgId={row.id}
                      parentName={row.parentId ? (orgsMap[row.parentId] ?? row.parentId) : undefined}
                    />
                  ),
                },
              ]}
            />
          ))}
          data={rows}
          total={rows.length}
          isLoading={listQuery.isLoading}
          bordered={false}
          tableClassName={tableDensityClass}
        />
      </TableCard>
    </div>
  );
}

function OrganizationDetails({ org, orgId, parentName }: { org: OrganizationSummary; orgId: string; parentName?: string }) {
  const trpc = useTRPC();
  const [open, setOpen] = React.useState(false);
  // Wires organization.getById — fetched lazily when the dialog opens.
  const full = useQuery(trpc.organization.getById.queryOptions({ id: orgId }, { enabled: open }));
  const data = (full.data ?? { ...org, name2: undefined, name3: undefined, address: null }) as OrganizationResponse;
  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "ID", value: data.id },
    { label: "Name", value: data.name1 },
    { label: "Name 2", value: data.name2 ?? "—" },
    { label: "Name 3", value: data.name3 ?? "—" },
    { label: "Type", value: data.orgType },
    { label: "Parent", value: parentName ?? "—" },
    { label: "Active", value: data.isActive ? "Yes" : "No" },
    { label: "Address", value: data.address ? `${data.address.street}, ${data.address.city} ${data.address.zipCode}` : "—" },
  ];
  return (
    <>
      <DropdownMenuItem onSelect={() => setOpen(true)}>View details</DropdownMenuItem>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{data.name1}</DialogTitle>
            <DialogDescription>Organization record</DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1 text-sm">
            {fields.map((f) => (
              <React.Fragment key={f.label}>
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd>{f.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}
