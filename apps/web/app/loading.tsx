import { Skeleton } from "@rocky/ui/components/skeleton";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-2xl" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </main>
  );
}
