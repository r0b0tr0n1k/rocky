"use client";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rocky/ui/components/card";

import { useSession } from "#lib/auth-client";
import { filterNavByPermissions, navSections } from "#lib/nav-config";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string; email?: string; permissions?: string[] } | undefined;
  const permissions = user?.permissions ?? [];
  const sections = filterNavByPermissions(navSections, permissions);
  const items = sections.flatMap((s) => s.items);
  const displayName = user?.name || user?.email || "there";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {displayName}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="outline-none">
            <Card className="h-full transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <div className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
                  <item.icon className="size-5" data-icon="inline-start" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Open the {item.title} workspace.</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
