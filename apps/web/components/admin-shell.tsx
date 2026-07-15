"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CookieIcon, LogOutIcon, SearchIcon } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@rocky/ui/components/avatar";
import { Button } from "@rocky/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rocky/ui/components/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@rocky/ui/components/sidebar";
import { Kbd } from "@rocky/ui/components/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@rocky/ui/components/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rocky/ui/components/dialog";

import { signOut, useSession } from "#lib/auth-client";
import { filterNavByPermissions, navSections } from "#lib/nav-config";
import { usePermissions } from "#lib/permissions";
import { CommandPalette } from "#components/command-palette";
import { ThemeToggle } from "#components/theme-toggle";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  // Gate session-derived UI behind mount. During SSR and the client's initial
  // hydration render `session` is undefined, but `useSession` resolves
  // synchronously from the cookie immediately afterwards. Rendering
  // user-specific content before mount causes a server/client hydration
  // mismatch that forces React to regenerate the whole sidebar subtree.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const user = mounted ? session?.user : undefined;
  const { permissions } = usePermissions();
  const roles = (user as { roles?: string[]; permissions?: string[] } | undefined)?.roles ?? [];
  const pathname = usePathname();
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [cookieOpen, setCookieOpen] = React.useState(false);

  const sections = React.useMemo(
    () => filterNavByPermissions(navSections, permissions),
    [permissions],
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const displayName = user?.name || user?.email || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="grid size-7 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                A
              </div>
              <span className="text-sm font-semibold tracking-tight">AIMCS</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {sections.map((section) => (
              <SidebarGroup key={section.title}>
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon data-icon="inline-start" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
              <Avatar className="size-7">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate font-medium">{displayName}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {roles.join(", ") || "—"}
                </div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger />
            <Button
              variant="outline"
              size="sm"
              className="w-full max-w-xs justify-start gap-2 text-muted-foreground"
              onClick={() => setCmdOpen(true)}
            >
              <SearchIcon data-icon="inline-start" />
              <span>Search…</span>
              <Kbd className="ml-auto">⌘K</Kbd>
            </Button>
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="User menu">
                    <Avatar className="size-7">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => signOut()}>
                    <LogOutIcon data-icon="inline-start" />
                    Sign out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setCookieOpen(true);
                    }}
                  >
                    <CookieIcon data-icon="inline-start" />
                    Cookie &amp; Tracking Notice
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
        <Dialog open={cookieOpen} onOpenChange={setCookieOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cookie &amp; Tracking Notice</DialogTitle>
              <DialogDescription>
                Rocky sets only the strictly-necessary session cookie (Better Auth) required to
                keep you signed in. Under ePrivacy Art 5(3) and GDPR Art 6(1)(e) (official
                authority) this cookie is exempt from consent. Rocky sets no analytics,
                advertising, or cross-site tracking cookies. Full text: ROCKY-COOK-001.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </TooltipProvider>
  );
}
