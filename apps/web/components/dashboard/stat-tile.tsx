import { Card, CardContent } from "@rocky/ui/components/card";
import { cn } from "@rocky/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Seal } from "#components/shared/seal";

/**
 * A contained metric — a sealed record. The diamond mark (top-right) makes the
 * "containment = sealed" metaphor literal; the figure is set in IBM Plex Mono
 * so regulatory numbers read like stamped metal, not a consumer dashboard.
 */
export function DashboardStat({
  label,
  value,
  hint,
  icon: Icon,
  href,
  className,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <span className="absolute right-3 top-3 text-seal" aria-hidden>
        <Seal variant="filled" className="size-5" />
      </span>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" data-icon="inline-start" />
          </span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="font-mono text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("group relative block overflow-hidden rounded-lg", className)}>
        {content}
      </Link>
    );
  }

  return <Card className={cn("relative overflow-hidden", className)}>{content}</Card>;
}
