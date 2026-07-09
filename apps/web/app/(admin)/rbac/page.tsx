"use client";

import { Badge } from "@rocky/ui/components/badge";

import {
  assignRoleToUserRequestSchema,
  type PermissionResponse,
  type RoleResponse,
  revokeRoleFromUserRequestSchema,
} from "@rocky/validators/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ActionDialog } from "#components/shared/action-dialog";
import { DataTable } from "#components/shared/data-table";
import { ComboboxField, DateField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { useTRPC } from "#lib/trpc";

const PAGE_SIZE = 20;

export default function RbacPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const roles = useQuery(trpc.rbac.listRoles.queryOptions());
  const permissions = useQuery(trpc.rbac.listPermissions.queryOptions());
  const users = useQuery(trpc.user.list.queryOptions({ limit: 100 }));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));

  const roleOptions = ((roles.data ?? []) as RoleResponse[]).map((r) => ({ value: r.id, label: r.name }));
  const userOptions = (
    (users.data ?? []) as { id: string; firstName?: string | null; lastName?: string | null; username: string }[]
  ).map((u) => ({
    value: u.id,
    label: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.username,
  }));
  const farmOptions = ((farms.data?.data ?? []) as { id: string; farmId: string; name: string }[]).map((f) => ({
    value: f.id,
    label: `${f.farmId} · ${f.name}`,
  }));

  const invalidate = (key: unknown) => queryClient.invalidateQueries({ queryKey: key as never });
  const assign = useMutation(
    trpc.rbac.assignRole.mutationOptions({ onSuccess: () => invalidate(trpc.rbac.listRoles.queryKey()) }),
  );
  const revoke = useMutation(
    trpc.rbac.revokeRole.mutationOptions({ onSuccess: () => invalidate(trpc.rbac.listRoles.queryKey()) }),
  );

  const roleColumns: ColumnDef<RoleResponse>[] = [
    { accessorKey: "name", header: "Name", enableSorting: false },
    {
      accessorKey: "description",
      header: "Description",
      enableSorting: false,
      cell: ({ row }) => row.original.description ?? "—",
    },
    {
      accessorKey: "priority",
      header: "Priority",
      enableSorting: false,
      cell: ({ row }) => <Badge variant="outline">{row.original.priority}</Badge>,
    },
    {
      accessorKey: "isSystem",
      header: "System",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isSystem ? <Badge variant="destructive">Yes</Badge> : <Badge variant="secondary">No</Badge>,
    },
  ];

  const permissionColumns: ColumnDef<PermissionResponse>[] = [
    { accessorKey: "resource", header: "Resource", enableSorting: false },
    { accessorKey: "action", header: "Action", enableSorting: false },
    {
      accessorKey: "description",
      header: "Description",
      enableSorting: false,
      cell: ({ row }) => row.original.description ?? "—",
    },
    { accessorKey: "scope", header: "Scope", enableSorting: false, cell: ({ row }) => row.original.scope ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="RBAC" description="Roles and permissions governing access." />
      <div className="flex flex-wrap gap-2">
        <ActionDialog
          triggerLabel="Assign role"
          schema={assignRoleToUserRequestSchema}
          mutation={assign}
          title="Assign role to user"
          description="Grant a role with optional scope and validity window."
          fields={(form) => (
            <>
              <ComboboxField
                control={form.control}
                name="userId"
                label="User"
                placeholder="Search users…"
                options={userOptions}
              />
              <ComboboxField
                control={form.control}
                name="roleId"
                label="Role"
                placeholder="Search roles…"
                options={roleOptions}
              />
              <ComboboxField
                control={form.control}
                name="scopeOrgId"
                label="Scope org (optional)"
                placeholder="org uuid"
                options={[]}
              />
              <ComboboxField
                control={form.control}
                name="scopeFarmId"
                label="Scope farm (optional)"
                placeholder="Search farms…"
                options={farmOptions}
              />
              <DateField control={form.control} name="validFrom" label="Valid from (optional)" />
              <DateField control={form.control} name="validTo" label="Valid to (optional)" />
            </>
          )}
        />
        <ActionDialog
          triggerLabel="Revoke role"
          schema={revokeRoleFromUserRequestSchema}
          mutation={revoke}
          title="Revoke role"
          description="Remove a role assignment from a user."
          fields={(form) => (
            <>
              <ComboboxField
                control={form.control}
                name="userId"
                label="User"
                placeholder="Search users…"
                options={userOptions}
              />
              <ComboboxField
                control={form.control}
                name="roleId"
                label="Role"
                placeholder="Search roles…"
                options={roleOptions}
              />
            </>
          )}
        />
      </div>

      <div className="flex flex-col gap-8">
        <DataTable
          columns={roleColumns}
          data={(roles.data ?? []) as RoleResponse[]}
          total={(roles.data ?? []).length}
          isLoading={roles.isLoading}
          page={0}
          pageSize={PAGE_SIZE}
        />
        <DataTable
          columns={permissionColumns}
          data={(permissions.data ?? []) as PermissionResponse[]}
          total={(permissions.data ?? []).length}
          isLoading={permissions.isLoading}
          page={0}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
