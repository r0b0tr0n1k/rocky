import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@rocky/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rocky/ui/components/empty";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestion className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>
            The page you are looking for does not exist or has been moved.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
