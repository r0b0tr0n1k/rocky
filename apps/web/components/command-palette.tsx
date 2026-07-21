"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@rocky/ui/components/command";
import { Dialog, DialogContent, DialogTitle } from "@rocky/ui/components/dialog";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useSession } from "#lib/auth-client";
import { filterNavByPermissions, type NavItem, navSections } from "#lib/nav-config";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as { permissions?: string[] } | undefined;
  const permissions = user?.permissions ?? [];
  const sections = React.useMemo(() => filterNavByPermissions(navSections, permissions), [permissions]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput placeholder="Search pages…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {sections.map((section) => (
              <CommandGroup key={section.title} heading={section.title}>
                {section.items.map((item: NavItem) => (
                  <CommandItem key={item.href} value={`${item.title} ${item.href}`} onSelect={() => go(item.href)}>
                    <item.icon data-icon="inline-start" />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
