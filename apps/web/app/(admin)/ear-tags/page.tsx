"use client";

import * as React from "react";

import {
  cancelOrderRequestSchema,
  createOrderRequestSchema,
  orderStatusTransitionSchema,
  type AnimalSummary,
  type EarTagResponse,
  type EarTagTypeResponse,
} from "@rocky/validators/api";
import { ORDER_STATUS } from "@rocky/validators/enums";
import { ComboboxField, NumberField, SelectField, TextareaField, TextField } from "#components/shared/form-fields";
import { ActionDialog } from "#components/shared/action-dialog";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { earTagColumns, earTagTypeColumns } from "#components/ear-tags/columns";
import { enumToOptions } from "#lib/options";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "#lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rocky/ui/components/tabs";

const PAGE_SIZE = 20;

export default function EarTagsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));
  const types = useQuery(trpc.earTag.listTypes.queryOptions({}));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));

  const animalMap = new Map<string, AnimalSummary>();
  ((animals.data?.data ?? []) as AnimalSummary[]).forEach((a) => animalMap.set(a.id, a));
  const typeMap = new Map<string, EarTagTypeResponse>();
  ((types.data ?? []) as EarTagTypeResponse[]).forEach((t) => typeMap.set(t.id, t));

  const animalLabel = (id: string | null | undefined) => {
    if (!id) return "—";
    const a = animalMap.get(id);
    return a ? `${a.stateCode}${a.earTagNumber}` : id;
  };
  const typeLabel = (id: string | null | undefined) => {
    if (!id) return "—";
    const t = typeMap.get(id);
    return t ? t.name : id;
  };

  const farmOptions = ((farms.data?.data ?? []) as { id: string; farmId: string; name: string }[]).map((f) => ({
    value: f.id,
    label: `${f.farmId} · ${f.name}`,
  }));

  const tagsQ = useQuery(trpc.earTag.list.queryOptions({ limit: PAGE_SIZE }));
  const ordersQ = useQuery(trpc.earTag.listOrders.queryOptions({ limit: PAGE_SIZE }));

  const invalidate = (key: unknown) => queryClient.invalidateQueries({ queryKey: key as never });
  const createOrder = useMutation(trpc.earTag.createOrder.mutationOptions({ onSuccess: () => invalidate(trpc.earTag.listOrders.queryKey()) }));
  const transition = useMutation(trpc.earTag.transitionStatus.mutationOptions({ onSuccess: () => invalidate(trpc.earTag.listOrders.queryKey()) }));
  const cancelOrder = useMutation(trpc.earTag.cancelOrder.mutationOptions({ onSuccess: () => invalidate(trpc.earTag.listOrders.queryKey()) }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ear tags" description="Ear tag inventory, orders, and tag types." />
      <Tabs defaultValue="tags" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
        </TabsList>

        <TabsContent value="tags">
          <DataTable
            columns={earTagColumns({ animalLabel, typeLabel })}
            data={(tagsQ.data?.data ?? []) as EarTagResponse[]}
            total={tagsQ.data?.total ?? 0}
            isLoading={tagsQ.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
        </TabsContent>

        <TabsContent value="orders">
          <DataTable
            columns={earTagColumns({ animalLabel, typeLabel })}
            data={(ordersQ.data?.data ?? []) as EarTagResponse[]}
            total={ordersQ.data?.total ?? 0}
            isLoading={ordersQ.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionDialog
              triggerLabel="New order"
              schema={createOrderRequestSchema}
              mutation={createOrder}
              title="New ear tag order"
              description="Place an order with a supplier organization."
              fields={(form) => (
                <>
                  <TextField control={form.control} name="organizationId" label="Organization ID (UUID)" placeholder="org uuid" />
                  <TextField control={form.control} name="supplierOrganizationId" label="Supplier org ID (UUID)" placeholder="supplier uuid" />
                  <TextField control={form.control} name="supplierName" label="Supplier name" placeholder="e.g. TagCo" />
                  <NumberField control={form.control} name="quantity" label="Quantity" placeholder="1000" />
                  <ComboboxField control={form.control} name="farmId" label="Farm (optional)" placeholder="Search farms…" options={farmOptions} />
                  <TextareaField control={form.control} name="description" label="Description" placeholder="Optional" />
                </>
              )}
            />
            <ActionDialog
              triggerLabel="Transition status"
              schema={orderStatusTransitionSchema}
              mutation={transition}
              title="Transition order status"
              description="Advance an order to a new lifecycle status."
              fields={(form) => (
                <>
                  <TextField control={form.control} name="orderId" label="Order ID (UUID)" placeholder="order uuid" />
                  <SelectField control={form.control} name="newStatus" label="New status" options={enumToOptions(Object.values(ORDER_STATUS))} />
                </>
              )}
            />
            <ActionDialog
              triggerLabel="Cancel order"
              schema={cancelOrderRequestSchema}
              mutation={cancelOrder}
              title="Cancel order"
              description="Cancel an ear tag order."
              fields={(form) => (
                <>
                  <TextField control={form.control} name="orderId" label="Order ID (UUID)" placeholder="order uuid" />
                  <TextareaField control={form.control} name="reason" label="Reason" placeholder="Optional" />
                </>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="types">
          <DataTable
            columns={earTagTypeColumns()}
            data={(types.data ?? []) as EarTagTypeResponse[]}
            total={(types.data ?? []).length}
            isLoading={types.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
