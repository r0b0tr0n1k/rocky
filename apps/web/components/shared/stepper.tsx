"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@rocky/ui/lib/utils";

export type StepStatus = "done" | "current" | "upcoming";

export interface Step {
  label: string;
  status?: StepStatus;
}

export interface StepperProps {
  steps: Step[];
  orientation?: "horizontal" | "vertical";
  className?: string;
}

/**
 * Reusable progress stepper (adapted from the @7ovr `steps` block, icon
 * swapped to lucide, made props-driven). Used by the parity pages for
 * lifecycle state: earTag 6-stage order, vsContract lifecycle.
 */
export function Stepper({ steps, orientation = "horizontal", className }: StepperProps) {
  const isVertical = orientation === "vertical";
  return (
    <ol className={cn("flex", isVertical ? "flex-col" : "flex-row", className)}>
      {steps.map((step, i) => {
        const status: StepStatus = step.status ?? "upcoming";
        const isLast = i === steps.length - 1;
        return (
          <li
            key={step.label}
            aria-current={status === "current" ? "step" : undefined}
            className={cn(
              "relative flex",
              isVertical ? "flex-1 flex-row items-start gap-3" : "flex-1 flex-col items-center",
            )}
          >
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute",
                  isVertical
                    ? "left-4 top-8 h-full w-0.5 -translate-x-1/2"
                    : "top-4 left-1/2 h-0.5 w-full -translate-y-1/2",
                  status === "done" ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-8 items-center justify-center text-sm font-medium tabular-nums",
                status === "done" && "bg-primary text-primary-foreground",
                status === "current" && "border-2 border-primary bg-background text-primary",
                status === "upcoming" && "border border-border bg-background text-muted-foreground",
              )}
            >
              {status === "done" ? <Check className="size-4" aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs",
                isVertical && "mt-0",
                isVertical ? "" : "mt-2",
                status === "upcoming" ? "text-muted-foreground" : "font-medium text-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
