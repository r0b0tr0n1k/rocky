"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Bookmark, Check, Rows2, Rows3, SearchIcon, SlidersHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { usePathname } from "next/navigation";

import { Button } from "@rocky/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rocky/ui/components/dropdown-menu";
import { Card, CardContent } from "@rocky/ui/components/card";
import { Input } from "@rocky/ui/components/input";

/**
 * Row density (frontend-iso-6 · ISO 9241-110: suitability for individualization).
 * Per-route persisted so each data view remembers the operator's preference.
 */
type TableDensity = "comfortable" | "compact";

const DENSITY_KEY = (path: string) => `rocky:table-density:${path}`;
const VIEWS_KEY = (path: string) => `rocky:table-views:${path}`;

interface SavedView {
  name: string;
  density: TableDensity;
}

function readDensity(path: string): TableDensity {
  if (typeof window === "undefined") return "comfortable";
  return (window.localStorage.getItem(DENSITY_KEY(path)) as TableDensity) ?? "comfortable";
}
function writeDensity(path: string, d: TableDensity) {
  window.localStorage.setItem(DENSITY_KEY(path), d);
}
function readViews(path: string): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(VIEWS_KEY(path)) ?? "[]") as SavedView[];
  } catch {
    return [];
  }
}
function writeViews(path: string, v: SavedView[]) {
  window.localStorage.setItem(VIEWS_KEY(path), JSON.stringify(v));
}

const TableDensityContext = React.createContext<{ density: TableDensity; setDensity: (d: TableDensity) => void }>({
  density: "comfortable",
  setDensity: () => {},
});

export function useTableDensity() {
  return React.useContext(TableDensityContext);
}

/** Tighter row padding for dense data grids (compact density). */
export const densityCompactClass = "[&_td]:!py-1.5 [&_th]:!py-1.5 text-xs";

function DensityToggle({ density, setDensity }: { density: TableDensity; setDensity: (d: TableDensity) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">{density === "compact" ? "Compact" : "Comfortable"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Row density</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setDensity("comfortable")}>
          <Rows3 className="size-4" /> Comfortable
          {density === "comfortable" && <Check className="ml-auto size-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setDensity("compact")}>
          <Rows2 className="size-4" /> Compact
          {density === "compact" && <Check className="ml-auto size-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ViewsMenu({
  views,
  onSave,
  onApply,
  viewName,
  setViewName,
}: {
  views: SavedView[];
  onSave: () => void;
  onApply: (v: SavedView) => void;
  viewName: string;
  setViewName: (s: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Bookmark className="size-4" /> Views
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Saved views</DropdownMenuLabel>
        {views.length === 0 ? (
          <DropdownMenuItem disabled>No saved views yet</DropdownMenuItem>
        ) : (
          views.map((v) => (
            <DropdownMenuItem key={v.name} onSelect={() => onApply(v)}>
              <Bookmark className="size-4" /> {v.name}
              <span className="ml-auto text-xs text-muted-foreground">{v.density}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <div className="flex items-center gap-1 p-1">
          <Input
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            placeholder="View name"
            className="h-8"
          />
          <Button size="sm" disabled={!viewName.trim()} onClick={onSave}>
            Save
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Contained data surface — the enterprise "control panel vs data payload"
 * boundary. A Card with an optional toolbar (left cluster + top-right action)
 * wrapping the table body. Used everywhere a list table appears so the eye
 * reads: command area (outside) → data payload (inside).
 */
export function TableCard({
  toolbarLeft,
  action,
  children,
  className,
}: {
  toolbarLeft?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const [density, setDensityState] = React.useState<TableDensity>(() => readDensity(pathname));
  const setDensity = React.useCallback(
    (d: TableDensity) => {
      setDensityState(d);
      writeDensity(pathname, d);
    },
    [pathname],
  );

  const views = React.useMemo(() => readViews(pathname), [pathname]);
  const [viewName, setViewName] = React.useState("");
  const saveView = () => {
    const name = viewName.trim();
    if (!name) return;
    writeViews(pathname, [...views.filter((v) => v.name !== name), { name, density }]);
    setViewName("");
  };
  const applyView = (v: SavedView) => setDensity(v.density);

  const hasToolbar = toolbarLeft != null || action != null;
  return (
    <TableDensityContext.Provider value={{ density, setDensity }}>
      <Card className={className}>
        {hasToolbar ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">{toolbarLeft}</div>
            <div className="flex items-center gap-1">
              <ViewsMenu
                views={views}
                onSave={saveView}
                onApply={applyView}
                viewName={viewName}
                setViewName={setViewName}
              />
              <DensityToggle density={density} setDensity={setDensity} />
              {action}
            </div>
          </div>
        ) : null}
        <CardContent>{children}</CardContent>
      </Card>
    </TableDensityContext.Provider>
  );
}

/** Leading-icon search box for table toolbars. */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full max-w-xs">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-8" />
    </div>
  );
}

/** Append a right-pinned row-action (kebab) column to a column set. */
export function appendRowActions<T>(columns: ColumnDef<T>[], rowActions: (row: T) => ReactNode): ColumnDef<T>[] {
  return [
    ...columns,
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      meta: { width: 64, align: "right" } as ColumnDef<T>["meta"],
      cell: ({ row }) => rowActions(row.original),
    },
  ];
}

/** Shared row-density class for contained tables (taller, less cramped). */
export const tableDensityClass = "[&_td]:!py-3 [&_th]:!py-3";
