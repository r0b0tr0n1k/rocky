import * as React from "react";
import type { ReactNode } from "react";

import { cn } from "@rocky/ui/lib/utils";

export interface PageHeaderProps {
  title: string;
  eyebrow?: ReactNode;
  description?: string;
  breadcrumb?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, eyebrow, description, breadcrumb, status, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 border-b border-brass/40 pb-6", className)}>
      {breadcrumb ? <div className="mb-2 text-sm text-muted-foreground">{breadcrumb}</div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          {eyebrow ? <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p> : null}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            {status ? <div className="inline-flex items-center">{status}</div> : null}
          </div>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
