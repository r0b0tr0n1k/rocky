"use client";

import { cn } from "@rocky/ui/lib/utils";
import { AlertCircle, Check } from "lucide-react";

export type TimelineStatus = "done" | "current" | "upcoming" | "error";

export interface TimelineItem {
  title: string;
  description?: string;
  timestamp?: string;
  status?: TimelineStatus;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

/**
 * Vertical timeline (composed locally, no registry dependency). Used by the
 * parity pages for sequence-bearing records: farmBook ledger, health clinical
 * record, movement lineage. Mirrors the Stepper node styling for consistency.
 */
export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {items.map((item, i) => {
        const status: TimelineStatus = item.status ?? "upcoming";
        const isLast = i === items.length - 1;
        return (
          <li key={item.title} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-4 top-8 h-full w-0.5 -translate-x-1/2",
                  status === "done" ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums",
                status === "done" && "bg-primary text-primary-foreground",
                status === "current" && "border-2 border-primary bg-background text-primary",
                status === "upcoming" && "border border-border bg-background text-muted-foreground",
                status === "error" && "border-2 border-destructive bg-background text-destructive",
              )}
            >
              {status === "done" ? (
                <Check className="size-4" aria-hidden="true" />
              ) : status === "error" ? (
                <AlertCircle className="size-4" aria-hidden="true" />
              ) : (
                i + 1
              )}
            </span>
            <div className="flex flex-col gap-0.5">
              <span
                className={cn(
                  "text-sm font-medium",
                  status === "upcoming" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {item.title}
              </span>
              {item.description ? <span className="text-xs text-muted-foreground">{item.description}</span> : null}
              {item.timestamp ? <span className="text-xs text-muted-foreground/70">{item.timestamp}</span> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
