"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
} from "lucide-react";

import { Button } from "@rocky/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rocky/ui/components/select";
import { Empty } from "@rocky/ui/components/empty";
import { Skeleton } from "@rocky/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rocky/ui/components/table";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  loading?: boolean;
  pageSizeOptions?: number[];
}

/**
 * Presentational, server-driven data table. The parent owns the tRPC
 * list query and passes the current page's rows plus the total count;
 * pagination/sorting state is held here and reported back via callbacks.
 */
export function DataTable<TData>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
  pageSizeOptions = [10, 20, 50],
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <Empty className="py-10">No records found.</Empty>;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="flex items-center gap-1 font-medium"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUpIcon className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon className="size-3.5" />
                          ) : (
                            <ChevronsUpDownIcon className="size-3.5 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {from}–{to} of {total}
        </div>
        <div className="flex items-center gap-3">
          {onPageSizeChange ? (
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeftIcon data-icon="inline-start" />
            </Button>
            <span className="text-sm tabular-nums">
              Page {page} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRightIcon data-icon="inline-start" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
