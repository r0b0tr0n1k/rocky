import {
  Archive,
  ArrowLeftRight,
  BookUser,
  Building2,
  ClipboardCheck,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Bell,
  PawPrint,
  RadioTower,
  ScrollText,
  ShieldCheck,
  UserCircle,
  TabletSmartphone,
  Tags,
  Users,
  UserCog,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  /** Required permission (from the RBAC seed). Omit for always-visible items. */
  permission?: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Livestock",
    items: [
      { title: "Animals", href: "/animals", permission: "animal:read", icon: PawPrint },
      { title: "Movements", href: "/movements", permission: "movement:read", icon: ArrowLeftRight },
      { title: "Passports", href: "/passports", permission: "passport:read", icon: BookUser },
      { title: "Ear Tags", href: "/ear-tags", permission: "eartag:read", icon: Tags },
    ],
  },
  {
    title: "Health",
    items: [{ title: "Health", href: "/health", permission: "health:read", icon: HeartPulse }],
  },
  {
    title: "Inspections",
    items: [
      { title: "Inspections", href: "/inspections", permission: "analysis:read", icon: ClipboardCheck },
      { title: "Corrections", href: "/corrections", permission: "correction:read", icon: Wrench },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { title: "Farms", href: "/farms", permission: "hk:farm", icon: Building2 },
      { title: "Organizations", href: "/organizations", permission: "sm:orgs", icon: Users },
      { title: "Subjects", href: "/subjects", permission: "hk:subject", icon: UserCircle },
      { title: "PDA Devices", href: "/devices", permission: "pda:sync", icon: TabletSmartphone },
      { title: "IoT", href: "/iot", permission: "pda:sync", icon: RadioTower },
    ],
  },
  {
    title: "Administration",
    items: [
      { title: "Notifications", href: "/notifications", permission: "notification:read", icon: Bell },
      { title: "Archive", href: "/archive", permission: "archive:read", icon: Archive },
      { title: "Documents", href: "/documents", permission: "report:read", icon: FileText },
      { title: "Roles & Permissions", href: "/rbac", permission: "sm:roles", icon: ShieldCheck },
      { title: "Users", href: "/users", permission: "sm:users", icon: UserCog },
      { title: "Audit", href: "/audit", permission: "sm:audit", icon: ScrollText },
    ],
  },
];

export function filterNavByPermissions(sections: NavSection[], permissions: string[]): NavSection[] {
  return sections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.permission || permissions.includes(i.permission)),
    }))
    .filter((s) => s.items.length > 0);
}
