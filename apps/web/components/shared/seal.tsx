import { cn } from "@rocky/ui/lib/utils";

/**
 * The Red Diamond Seal — the brand mark of an official, contained record.
 * `filled` = sealed / official / synced; `open` = pending / offline.
 * Color is inherited (set `text-seal` etc. on the parent).
 */
export function Seal({
  variant = "filled",
  className,
  title,
}: {
  variant?: "filled" | "open";
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={title ?? "Official seal"}
      className={cn("size-4", className)}
      fill="none"
    >
      <path
        d="M12 2.5 21.5 12 12 21.5 2.5 12Z"
        fill={variant === "filled" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={variant === "filled" ? 0 : 2}
        strokeLinejoin="round"
      />
      {variant === "filled" ? <path d="M12 7 17 12 12 17 7 12Z" fill="currentColor" fillOpacity={0.35} /> : null}
    </svg>
  );
}
