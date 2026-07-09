"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";

import { cn } from "@rocky/ui/lib/utils";
import { Button } from "@rocky/ui/components/button";
import { Empty } from "@rocky/ui/components/empty";
import { Pagination, PaginationContent, PaginationItem } from "@rocky/ui/components/pagination";
import { Skeleton } from "@rocky/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rocky/ui/components/table";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  total: number;
  isLoading?: boolean;
  sort?: { id: string; desc: boolean } | null;
  onSortChange?: (sort: { id: string; desc: boolean } | null) => void;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  /** When false, drop the outer border (used when nested inside a Card). */
  bordered?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  total,
  isLoading = false,
  sort = null,
  onSortChange,
  page = 0,
  pageSize = 20,
  onPageChange,
  bordered = true,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    state: { sorting: sort ? [{ id: sort.id, desc: sort.desc }] : [] },
  });

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 0;
  const canNext = page < pageCount - 1;

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("rounded-md border", !bordered && "border-0 rounded-none")}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = sort?.id === header.column.id ? sort.desc : null;
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="flex items-center gap-1 text-left font-medium"
                          onClick={() =>
                            onSortChange?.({
                              id: header.column.id,
                              desc: sorted ? !sorted : true,
                            })
                          }
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ChevronsUpDown className="size-3.5 opacity-50" />
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
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32">
                  <Empty>No results.</Empty>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {onPageChange ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} total · page {page + 1} of {pageCount}
          </p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
                  <ChevronLeft />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
                  <ChevronRight />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
