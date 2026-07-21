"use client";

import { Button } from "@rocky/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rocky/ui/components/dialog";
import { DropdownMenuItem } from "@rocky/ui/components/dropdown-menu";
import { Input } from "@rocky/ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rocky/ui/components/tabs";
import {
  type AnimalSummary,
  appendToOrderRequestSchema,
  assignSupplierContingentRequestSchema,
  cancelOrderItemRequestSchema,
  cancelOrderRequestSchema,
  collectOrderTagsRequestSchema,
  createDuplicateOrderRequestSchema,
  createOrderRequestSchema,
  type EarTagOrderResponse,
  type EarTagResponse,
  type EarTagTypeResponse,
  orderStatusTransitionSchema,
  updateOrderRequestSchema,
} from "@rocky/validators/api";
import { contingentTypeSchema, EAR_TAG_ORDER_STATUS, ORDER_STATUS } from "@rocky/validators/enums";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { earTagColumns, earTagTypeColumns } from "#components/ear-tags/columns";
import { earTagOrderColumns } from "#components/ear-tags/order-columns";
import { ActionDialog, RowActionMenu } from "#components/shared/action-dialog";
import { DataTable } from "#components/shared/data-table";
import { ComboboxField, NumberField, SelectField, TextareaField, TextField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { type DetailField, RowDetailsDialog } from "#components/shared/row-details-dialog";
import { Stepper } from "#components/shared/stepper";
import { appendRowActions, TableCard, tableDensityClass } from "#components/shared/table-card";
import { enumToOptions } from "#lib/options";
import { useCan } from "#lib/permissions";
import { useTRPC } from "#lib/trpc";

const PAGE_SIZE = 20;

export default function EarTagsPage() {
  const trpc = useTRPC();
  const canOrder = useCan("eartag:order");
  const queryClient = useQueryClient();

  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));
  const types = useQuery(trpc.earTag.listTypes.queryOptions({}));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));

  const animalMap = new Map<string, AnimalSummary>();
  ((animals.data?.data ?? []) as AnimalSummary[]).forEach((a) => {
    animalMap.set(a.id, a);
  });
  const typeMap = new Map<string, EarTagTypeResponse>();
  ((types.data ?? []) as EarTagTypeResponse[]).forEach((t) => {
    typeMap.set(t.id, t);
  });

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
  const typeOptions = ((types.data ?? []) as EarTagTypeResponse[]).map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const tagsQ = useQuery(trpc.earTag.list.queryOptions({ limit: PAGE_SIZE }));
  const ordersQ = useQuery(trpc.earTag.listOrders.queryOptions({ limit: PAGE_SIZE }));

  const invalidate = (key: unknown) => queryClient.invalidateQueries({ queryKey: key as never });
  const createOrder = useMutation(
    trpc.earTag.createOrder.mutationOptions({ onSuccess: () => invalidate(trpc.earTag.listOrders.queryKey()) }),
  );
  const transition = useMutation(
    trpc.earTag.transitionStatus.mutationOptions({ onSuccess: () => invalidate(trpc.earTag.listOrders.queryKey()) }),
  );
  const cancelOrder = useMutation(
    trpc.earTag.cancelOrder.mutationOptions({ onSuccess: () => invalidate(trpc.earTag.listOrders.queryKey()) }),
  );
  const collectOrderTags = useMutation(
    trpc.earTag.collectOrderTags.mutationOptions({ onSuccess: () => invalidate(trpc.earTag.listOrders.queryKey()) }),
  );
  const appendToOrder = useMutation(
    trpc.earTag.appendToOrder.mutationOptions({ onSuccess: () => invalidate(trpc.earTag.listOrders.queryKey()) }),
  );
  const assignSupplierContingent = useMutation(
    trpc.earTag.assignSupplierContingent.mutationOptions({ onSuccess: () => invalidate(trpc.earTag.list.queryKey()) }),
  );

  const [orderLifecycle, setOrderLifecycle] = React.useState<EarTagOrderResponse | null>(null);
  const ORDER_STEP_ORDER = Object.values(EAR_TAG_ORDER_STATUS);
  function orderStep(s: string, current: string): "done" | "current" | "upcoming" {
    const cur = ORDER_STEP_ORDER.indexOf(current);
    const i = ORDER_STEP_ORDER.indexOf(s);
    if (s === current) return "current";
    return i < cur ? "done" : "upcoming";
  }

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
          <TableCard>
            <DataTable
              columns={appendRowActions(earTagColumns({ animalLabel, typeLabel }), (row) => (
                <RowActionMenu
                  items={[
                    {
                      type: "dialog",
                      dialog: <EarTagDetails tag={row} animalLabel={animalLabel} typeLabel={typeLabel} />,
                    },
                  ]}
                />
              ))}
              data={(tagsQ.data?.data ?? []) as EarTagResponse[]}
              total={tagsQ.data?.total ?? 0}
              isLoading={tagsQ.isLoading}
              page={0}
              pageSize={PAGE_SIZE}
              bordered={false}
              tableClassName={tableDensityClass}
            />
          </TableCard>
        </TabsContent>

        <TabsContent value="orders">
          <TableCard
            action={
              <div className="flex flex-wrap gap-2">
                {canOrder && (
                  <ActionDialog
                    triggerLabel="New order"
                    schema={createOrderRequestSchema}
                    mutation={createOrder}
                    title="New ear tag order"
                    description="Place an order with a supplier organization."
                    fields={(form) => (
                      <>
                        <TextField
                          control={form.control}
                          name="organizationId"
                          label="Organization ID (UUID)"
                          placeholder="org uuid"
                        />
                        <TextField
                          control={form.control}
                          name="supplierOrganizationId"
                          label="Supplier org ID (UUID)"
                          placeholder="supplier uuid"
                        />
                        <TextField
                          control={form.control}
                          name="supplierName"
                          label="Supplier name"
                          placeholder="e.g. TagCo"
                        />
                        <NumberField control={form.control} name="quantity" label="Quantity" placeholder="1000" />
                        <ComboboxField
                          control={form.control}
                          name="farmId"
                          label="Farm (optional)"
                          placeholder="Search farms…"
                          options={farmOptions}
                        />
                        <TextareaField
                          control={form.control}
                          name="description"
                          label="Description"
                          placeholder="Optional"
                        />
                      </>
                    )}
                  />
                )}
                <ActionDialog
                  triggerLabel="Transition status"
                  schema={orderStatusTransitionSchema}
                  mutation={transition}
                  title="Transition order status"
                  description="Advance an order to a new lifecycle status."
                  fields={(form) => (
                    <>
                      <TextField
                        control={form.control}
                        name="orderId"
                        label="Order ID (UUID)"
                        placeholder="order uuid"
                      />
                      <SelectField
                        control={form.control}
                        name="newStatus"
                        label="New status"
                        options={enumToOptions(Object.values(ORDER_STATUS))}
                      />
                    </>
                  )}
                />
                <ActionDialog
                  triggerLabel="Cancel order"
                  schema={cancelOrderRequestSchema}
                  mutation={cancelOrder}
                  title="Cancel order"
                  description="Cancel an ear tag order."
                  alert="This cancels the ear tag order. This action cannot be undone."
                  alertVariant="destructive"
                  fields={(form) => (
                    <>
                      <TextField
                        control={form.control}
                        name="orderId"
                        label="Order ID (UUID)"
                        placeholder="order uuid"
                      />
                      <TextareaField control={form.control} name="reason" label="Reason" placeholder="Optional" />
                    </>
                  )}
                />
                <ActionDialog
                  triggerLabel="Assign contingent"
                  schema={assignSupplierContingentRequestSchema}
                  mutation={assignSupplierContingent}
                  title="Assign supplier contingent"
                  description="Reserve a range of tags for a supplier / farm / type."
                  fields={(form) => (
                    <>
                      <TextField
                        control={form.control}
                        name="supplierOrganizationId"
                        label="Supplier org ID (UUID)"
                        placeholder="supplier uuid"
                      />
                      <ComboboxField
                        control={form.control}
                        name="farmId"
                        label="Farm"
                        placeholder="Search farms…"
                        options={farmOptions}
                      />
                      <ComboboxField
                        control={form.control}
                        name="typeId"
                        label="Tag type"
                        placeholder="Search types…"
                        options={typeOptions}
                      />
                      <TextField
                        control={form.control}
                        name="tagRangeStart"
                        label="Tag range start"
                        placeholder="8-char e.g. 00012345"
                      />
                      <TextField
                        control={form.control}
                        name="tagRangeEnd"
                        label="Tag range end"
                        placeholder="8-char e.g. 00012399"
                      />
                      <NumberField control={form.control} name="quantity" label="Quantity" placeholder="100" />
                      <SelectField
                        control={form.control}
                        name="contingentType"
                        label="Contingent type"
                        options={enumToOptions(contingentTypeSchema.options as readonly string[])}
                      />
                    </>
                  )}
                />
                <GenerateTagNumbersDialog />
                <TakeoverFileDialog />
              </div>
            }
          >
            <DataTable
              columns={appendRowActions(earTagOrderColumns({ onViewLifecycle: setOrderLifecycle }), (row) => (
                <RowActionMenu
                  items={[
                    {
                      type: "dialog",
                      dialog: (
                        <ActionDialog
                          as="menuitem"
                          triggerLabel="Collect tags"
                          schema={collectOrderTagsRequestSchema}
                          mutation={collectOrderTags}
                          title="Collect order tags"
                          description="Mark the ordered tags as collected from the supplier."
                          defaultValues={{ orderId: row.id, supplierOrganizationId: row.supplierOrganizationId ?? "" }}
                          fields={() => (
                            <p className="text-sm text-muted-foreground">
                              Collects tags from supplier {row.supplierOrganizationId ?? "unknown"}.
                            </p>
                          )}
                        />
                      ),
                    },
                    {
                      type: "dialog",
                      dialog: (
                        <ActionDialog
                          as="menuitem"
                          triggerLabel="Append to order"
                          schema={appendToOrderRequestSchema}
                          mutation={appendToOrder}
                          title="Append to order"
                          description="Add additional quantity to an existing order."
                          defaultValues={{ orderId: row.id, organizationId: row.organizationId ?? "" }}
                          fields={(form) => (
                            <>
                              <TextField
                                control={form.control}
                                name="organizationId"
                                label="Organization ID (UUID)"
                                placeholder="org uuid"
                              />
                              <NumberField
                                control={form.control}
                                name="additionalQuantity"
                                label="Additional quantity"
                                placeholder="100"
                              />
                            </>
                          )}
                        />
                      ),
                    },
                    {
                      type: "dialog",
                      dialog: <OrderDetailDialog orderId={row.id} order={row} />,
                    },
                  ]}
                />
              ))}
              data={(ordersQ.data?.data ?? []) as EarTagOrderResponse[]}
              total={ordersQ.data?.total ?? 0}
              isLoading={ordersQ.isLoading}
              page={0}
              pageSize={PAGE_SIZE}
              bordered={false}
              tableClassName={tableDensityClass}
            />
          </TableCard>
        </TabsContent>

        <TabsContent value="types">
          <TableCard>
            <DataTable
              columns={earTagTypeColumns()}
              data={(types.data ?? []) as EarTagTypeResponse[]}
              total={(types.data ?? []).length}
              isLoading={types.isLoading}
              page={0}
              pageSize={PAGE_SIZE}
              bordered={false}
              tableClassName={tableDensityClass}
            />
          </TableCard>
        </TabsContent>
      </Tabs>

      <Dialog
        open={orderLifecycle !== null}
        onOpenChange={(open) => {
          if (!open) setOrderLifecycle(null);
        }}
      >
        {orderLifecycle ? (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Order lifecycle</DialogTitle>
              <DialogDescription>Supplier: {orderLifecycle.supplierName ?? "—"}</DialogDescription>
            </DialogHeader>
            <Stepper
              steps={ORDER_STEP_ORDER.map((s) => ({
                label: s,
                status: orderStep(s, orderLifecycle.status),
              }))}
              orientation="horizontal"
            />
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function EarTagDetails({
  tag,
  animalLabel,
  typeLabel,
}: {
  tag: EarTagResponse;
  animalLabel: (id: string | null | undefined) => string;
  typeLabel: (id: string | null | undefined) => string;
}) {
  const fields: DetailField[] = [
    { label: "Tag no", value: tag.tagNumber },
    { label: "State", value: tag.stateCode ?? "\u2014" },
    { label: "Type", value: typeLabel(tag.typeId) },
    { label: "Status", value: tag.status },
    { label: "Animal", value: animalLabel(tag.animalId) },
    { label: "Applied", value: tag.appliedDate ? new Date(tag.appliedDate).toLocaleDateString() : "\u2014" },
  ];
  return <RowDetailsDialog title={`Tag ${tag.tagNumber}`} description="Ear tag" fields={fields} />;
}

// ── Ear-tag order detail: edit / cancel-item / duplicate (closes updateOrder, cancelOrderItem, createDuplicateOrder parity gaps) ──

function OrderDetailDialog({ orderId, order }: { orderId: string; order: EarTagOrderResponse }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const orderQ = useQuery(trpc.earTag.getOrderById.queryOptions({ id: orderId }, { enabled: open }));
  const itemsQ = useQuery(trpc.earTag.list.queryOptions({ orderId, limit: 100 }, { enabled: open }));
  const data = (orderQ.data ?? order) as EarTagOrderResponse;
  const items = (itemsQ.data?.data ?? []) as EarTagResponse[];
  const deliveryStr = data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString().slice(0, 10) : "";

  const updateOrder = useMutation(
    trpc.earTag.updateOrder.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.earTag.getOrderById.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.earTag.listOrders.queryKey() });
      },
    }),
  );
  const cancelOrderItem = useMutation(
    trpc.earTag.cancelOrderItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.earTag.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.earTag.listOrders.queryKey() });
      },
    }),
  );
  const duplicateOrder = useMutation(
    trpc.earTag.createDuplicateOrder.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.earTag.listOrders.queryKey() }),
    }),
  );

  const detailFields: { label: string; value: React.ReactNode }[] = [
    { label: "Order no", value: data.orderNumber ?? data.id },
    { label: "Status", value: data.status },
    { label: "Supplier", value: data.supplierName },
    { label: "Total qty", value: data.totalQuantity },
    { label: "Organization", value: data.organizationId },
    { label: "Supplier org", value: data.supplierOrganizationId },
    { label: "Notes", value: data.notes ?? "\u2014" },
    {
      label: "Expected delivery",
      value: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toLocaleDateString() : "\u2014",
    },
  ];

  return (
    <>
      <DropdownMenuItem onSelect={() => setOpen(true)}>Details</DropdownMenuItem>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{data.orderNumber ?? "Order"}</DialogTitle>
            <DialogDescription>Ear tag procurement order</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <ActionDialog
              triggerLabel="Edit order"
              schema={updateOrderRequestSchema}
              mutation={updateOrder}
              title="Edit order"
              description="Update supplier, quantity, delivery date, or notes."
              defaultValues={{
                orderId: data.id,
                supplierName: data.supplierName,
                notes: data.notes ?? "",
                expectedDeliveryDate: deliveryStr,
                totalQuantity: data.totalQuantity,
              }}
              fields={(form) => (
                <>
                  <TextField control={form.control} name="supplierName" label="Supplier name" />
                  <NumberField control={form.control} name="totalQuantity" label="Total quantity" />
                  <TextField
                    control={form.control}
                    name="expectedDeliveryDate"
                    label="Expected delivery (YYYY-MM-DD)"
                    placeholder="2026-07-12"
                  />
                  <TextareaField control={form.control} name="notes" label="Notes" placeholder="Optional" />
                </>
              )}
            />

            <dl className="grid grid-cols-[160px_1fr] gap-x-3 gap-y-1 text-sm">
              {detailFields.map((f) => (
                <React.Fragment key={f.label}>
                  <dt className="text-muted-foreground">{f.label}</dt>
                  <dd>{f.value}</dd>
                </React.Fragment>
              ))}
            </dl>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Ordered tags ({items.length})</h4>
                <ActionDialog
                  triggerLabel="Duplicate order"
                  schema={createDuplicateOrderRequestSchema}
                  mutation={duplicateOrder}
                  title="Duplicate order"
                  description="Create a new order duplicating this supplier."
                  defaultValues={{
                    organizationId: data.organizationId ?? "",
                    supplierOrganizationId: data.supplierOrganizationId ?? "",
                    supplierName: data.supplierName,
                    description: "",
                  }}
                  fields={(form) => (
                    <>
                      <TextField
                        control={form.control}
                        name="animalId"
                        label="Animal ID (UUID)"
                        placeholder="animal uuid"
                      />
                      <TextField control={form.control} name="farmId" label="Farm ID (UUID)" placeholder="farm uuid" />
                      <TextField
                        control={form.control}
                        name="organizationId"
                        label="Organization ID (UUID)"
                        placeholder="org uuid"
                      />
                      <TextField
                        control={form.control}
                        name="supplierOrganizationId"
                        label="Supplier org ID (UUID)"
                        placeholder="supplier uuid"
                      />
                      <TextField
                        control={form.control}
                        name="supplierName"
                        label="Supplier name"
                        placeholder="e.g. TagCo"
                      />
                      <TextareaField
                        control={form.control}
                        name="description"
                        label="Description"
                        placeholder="Optional"
                      />
                    </>
                  )}
                />
              </div>
              <ul className="flex flex-col gap-1">
                {items.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No tags linked to this order yet.</li>
                ) : (
                  items.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <span>
                        {t.tagNumber ?? t.id} · {t.status}
                      </span>
                      <ActionDialog
                        triggerLabel="Cancel item"
                        schema={cancelOrderItemRequestSchema}
                        mutation={cancelOrderItem}
                        title="Cancel order item"
                        description={`Cancel ear tag ${t.tagNumber ?? t.id} from this order.`}
                        alert="This removes the tag from the order."
                        alertVariant="destructive"
                        defaultValues={{ orderId: data.id, earTagId: t.id }}
                        fields={() => (
                          <p className="text-sm text-muted-foreground">Confirm cancellation of this ordered tag.</p>
                        )}
                      />
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Generate tag numbers (query-based utility; no row bound) ──

function GenerateTagNumbersDialog() {
  const trpc = useTRPC();
  const [params, setParams] = React.useState<{ count: number; startFrom?: number } | null>(null);
  const [count, setCount] = React.useState<number>(100);
  const [startFrom, setStartFrom] = React.useState<string>("");
  const genQ = useQuery(trpc.earTag.generateTagNumbers.queryOptions(params ?? skipToken));
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Generate tag numbers</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate tag numbers</DialogTitle>
          <DialogDescription>Generate a batch of ear tag numbers.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Count</label>
            <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Start from (optional)</label>
            <Input value={startFrom} onChange={(e) => setStartFrom(e.target.value)} placeholder="10000001" />
          </div>
          <Button
            onClick={() => setParams({ count, startFrom: startFrom ? Number(startFrom) : undefined })}
            disabled={genQ.isFetching}
          >
            Generate
          </Button>
          {genQ.data ? (
            <ul className="max-h-60 overflow-y-auto rounded-md border p-2 text-sm">
              {(genQ.data.tags ?? []).map((t: string) => (
                <li key={t} className="font-mono">
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Takeover file: the tag-authority handover record (tracking, not minting) ──

function TakeoverFileDialog() {
  const trpc = useTRPC();
  const [takeoverId, setTakeoverId] = React.useState<string>("");
  const [params, setParams] = React.useState<string | null>(null);
  const fileQ = useQuery(trpc.earTag.getTakeoverFile.queryOptions(params ? { takeoverId: params } : skipToken));
  const data = fileQ.data;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Takeover file</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Takeover file</DialogTitle>
          <DialogDescription>
            Retrieve the tag-authority handover file for a takeover. This is the record of how a batch of tags was
            delegated to a supplier.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Takeover ID (UUID)</label>
            <Input value={takeoverId} onChange={(e) => setTakeoverId(e.target.value)} placeholder="takeover uuid" />
          </div>
          <Button onClick={() => setParams(takeoverId || null)} disabled={fileQ.isFetching || !takeoverId}>
            Retrieve
          </Button>
          {data ? (
            <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
              <div className="text-muted-foreground">
                {data.fileName} · {data.lineCount} lines
              </div>
              <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                {data.content}
              </pre>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
