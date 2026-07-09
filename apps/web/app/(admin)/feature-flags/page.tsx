"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@rocky/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rocky/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@rocky/ui/components/empty";
import { Switch } from "@rocky/ui/components/switch";
import { PageHeader } from "#components/shared/page-header";
import { useTRPC } from "#lib/trpc";
import { useCan } from "#lib/permissions";
import { type ModuleResponse } from "@rocky/validators/api";

export default function FeatureFlagsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const canWrite = useCan("sm:modules:write");

  const listQuery = useQuery(trpc.modules.list.queryOptions({ limit: 100, offset: 0 }));
  const toggle = useMutation(
    trpc.modules.update.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.modules.list.queryKey() }),
    }),
  );

  const rows = (listQuery.data?.data ?? []) as ModuleResponse[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Feature Flags"
        description="Globally enable or disable application modules."
      />
      {rows.length === 0 && !listQuery.isLoading ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No modules</EmptyTitle>
            <EmptyDescription>No feature-flag modules are registered.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle className="truncate">{m.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span className="font-mono text-xs">{m.name}</span>
                      {m.type ? <Badge variant="outline">{m.type}</Badge> : null}
                      {m.route ? <span className="text-xs text-muted-foreground">· {m.route}</span> : null}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={m.isActive}
                    disabled={!canWrite}
                    onCheckedChange={(next) => toggle.mutate({ id: m.id, data: { isActive: next } })}
                    aria-label={`Toggle ${m.title}`}
                  />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
