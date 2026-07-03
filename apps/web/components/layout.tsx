import { cn } from "@rocky/ui/lib/utils";

export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}

export function Main({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <main
      className={cn("flex-1", className)}
      {...props}
    />
  );
}

export interface ProseProps extends React.HTMLAttributes<HTMLDivElement> {
  isArticle?: boolean;
}

export function Prose({ className, isArticle, ...props }: ProseProps) {
  return (
    <div
      className={cn("prose dark:prose-invert max-w-none", className)}
      {...props}
    />
  );
}
