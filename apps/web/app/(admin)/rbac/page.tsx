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
import { ActionDialog, RowActionMenu } from "#components/shared/action-dialog";
import { DataTable } from "#components/shared/data-table";
import { ComboboxField, DateField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { RowDetailsDialog, type DetailField } from "#components/shared/row-details-dialog";
import { TableCard, tableDensityClass, appendRowActions } from "#components/shared/table-card";
import { useTRPC } from "#lib/trpc";
import { usePermissions } from "#lib/permissions";

const PAGE_SIZE = 20;

export default function RbacPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { roles: principalRoles } = usePermissions();
  const isSuperAdmin = principalRoles.includes("SUPER_ADMIN");

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

  const roleColumns: ColumnDef<RoleResponse>[] = appendRowActions([
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
  ], (row) => (
    <RowActionMenu items={[{ type: "dialog", dialog: <RbacRoleDetails role={row} /> }]} />
  ));

  const permissionColumns: ColumnDef<PermissionResponse>[] = appendRowActions([
    { accessorKey: "resource", header: "Resource", enableSorting: false },
    { accessorKey: "action", header: "Action", enableSorting: false },
    {
      accessorKey: "description",
      header: "Description",
      enableSorting: false,
      cell: ({ row }) => row.original.description ?? "—",
    },
    { accessorKey: "scope", header: "Scope", enableSorting: false, cell: ({ row }) => row.original.scope ?? "—" },
  ], (row) => (
    <RowActionMenu items={[{ type: "dialog", dialog: <RbacPermissionDetails permission={row} /> }]} />
  ));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="RBAC" description="Roles and permissions governing access." />
      <div className="flex flex-wrap gap-2">
        {isSuperAdmin && (
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
        )}
        {isSuperAdmin && (
        <ActionDialog
          triggerLabel="Revoke role"
          schema={revokeRoleFromUserRequestSchema}
          mutation={revoke}
          title="Revoke role"
          description="Remove a role assignment from a user."
          alert="This permanently removes the role assignment and its scope/validity window."
          alertVariant="destructive"
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
        )}
      </div>

      <div className="flex flex-col gap-8">
        <TableCard>
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Roles</h3>
            <p className="text-sm text-muted-foreground">Role definitions and their permission assignments.</p>
          </div>
          <DataTable
            columns={roleColumns}
            data={(roles.data ?? []) as RoleResponse[]}
            total={(roles.data ?? []).length}
            isLoading={roles.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
            bordered={false}
            tableClassName={tableDensityClass}
          />
        </TableCard>
        <TableCard>
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Permissions</h3>
            <p className="text-sm text-muted-foreground">Available permission codes across the system.</p>
          </div>
          <DataTable
            columns={permissionColumns}
            data={(permissions.data ?? []) as PermissionResponse[]}
            total={(permissions.data ?? []).length}
            isLoading={permissions.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
            bordered={false}
            tableClassName={tableDensityClass}
          />
        </TableCard>
      </div>
    </div>
  );
}

function RbacRoleDetails({ role }: { role: RoleResponse }) {
  const fields: DetailField[] = [
    { label: "Name", value: role.name },
    { label: "Description", value: role.description ?? "—" },
    { label: "Priority", value: role.priority },
    { label: "System", value: role.isSystem ? "Yes" : "No" },
    { label: "Created", value: new Date(role.createdAt).toLocaleDateString() },
  ];
  return <RowDetailsDialog title={role.name} description="Role" fields={fields} />;
}

function RbacPermissionDetails({ permission }: { permission: PermissionResponse }) {
  const fields: DetailField[] = [
    { label: "Resource", value: permission.resource },
    { label: "Action", value: permission.action },
    { label: "Scope", value: permission.scope },
    { label: "Description", value: permission.description ?? "—" },
    { label: "Created", value: new Date(permission.createdAt).toLocaleDateString() },
  ];
  return <RowDetailsDialog title={`${permission.resource}:${permission.action}`} description="Permission" fields={fields} />;
}
