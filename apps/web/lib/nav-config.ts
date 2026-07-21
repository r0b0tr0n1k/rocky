import {
  Archive,
  ArrowLeftRight,
  Bell,
  BookOpen,
  BookUser,
  Building2,
  ClipboardCheck,
  FileSignature,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Link2,
  type LucideIcon,
  Map as MapIcon,
  Network,
  PawPrint,
  RadioTower,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  TabletSmartphone,
  Tags,
  ToggleLeft,
  UserCircle,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

export interface NavItem {
  /** Display string (English fallback kept for backward-compat with call sites). */
  title: string;
  /** i18n catalog key (WO-086). When set, AdminShell renders t(titleKey) ?? title. */
  titleKey?: string;
  href: string;
  /** Required permission (from the RBAC seed). Omit for always-visible items. */
  permission?: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  /** i18n catalog key for the section heading. */
  titleKey?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Overview",
    titleKey: "nav.overview",
    items: [{ title: "Dashboard", titleKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Livestock",
    titleKey: "nav.livestock",
    items: [
      { title: "Animals", titleKey: "nav.animals", href: "/animals", permission: "animal:read", icon: PawPrint },
      {
        title: "Movements",
        titleKey: "nav.movements",
        href: "/movements",
        permission: "movement:read",
        icon: ArrowLeftRight,
      },
      { title: "Movement Lineage", titleKey: "nav.movementLineage", href: "/movement-lineage", icon: Network },
      {
        title: "Passports",
        titleKey: "nav.passports",
        href: "/passports",
        permission: "passport:read",
        icon: BookUser,
      },
      { title: "Ear Tags", titleKey: "nav.earTags", href: "/ear-tags", permission: "eartag:read", icon: Tags },
      { title: "VS Contracts", titleKey: "nav.vsContracts", href: "/vs-contracts", icon: FileSignature },
      { title: "VS Assignments", titleKey: "nav.vsAssignments", href: "/vs-assignments", icon: Link2 },
    ],
  },
  {
    title: "Health",
    titleKey: "nav.health",
    items: [{ title: "Health", titleKey: "nav.health", href: "/health", permission: "health:read", icon: HeartPulse }],
  },
  {
    title: "Inspections",
    titleKey: "nav.inspections",
    items: [
      {
        title: "Inspections",
        titleKey: "nav.inspections",
        href: "/inspections",
        permission: "analysis:read",
        icon: ClipboardCheck,
      },
      {
        title: "Corrections",
        titleKey: "nav.corrections",
        href: "/corrections",
        permission: "correction:read",
        icon: Wrench,
      },
    ],
  },
  {
    title: "Infrastructure",
    titleKey: "nav.infrastructure",
    items: [
      { title: "Farms", titleKey: "nav.farms", href: "/farms", permission: "hk:farm:read", icon: Building2 },
      { title: "Farm Books", titleKey: "nav.farmBooks", href: "/farm-books", icon: BookOpen },
      {
        title: "Organizations",
        titleKey: "nav.organizations",
        href: "/organizations",
        permission: "sm:orgs:read",
        icon: Users,
      },
      {
        title: "Subjects",
        titleKey: "nav.subjects",
        href: "/subjects",
        permission: "hk:subject:read",
        icon: UserCircle,
      },
      {
        title: "PDA Devices",
        titleKey: "nav.pdaDevices",
        href: "/devices",
        permission: "pda:sync",
        icon: TabletSmartphone,
      },
      { title: "IoT", titleKey: "nav.iot", href: "/iot", permission: "pda:sync", icon: RadioTower },
      { title: "Geo & EUDR", titleKey: "nav.geo", href: "/geo", icon: MapIcon },
      { title: "Offline Sync", titleKey: "nav.offlineSync", href: "/sync", icon: RefreshCw },
    ],
  },
  {
    title: "Administration",
    titleKey: "nav.administration",
    items: [
      {
        title: "Notifications",
        titleKey: "nav.notifications",
        href: "/notifications",
        permission: "notification:read",
        icon: Bell,
      },
      { title: "Archive", titleKey: "nav.archive", href: "/archive", permission: "archive:read", icon: Archive },
      { title: "Documents", titleKey: "nav.documents", href: "/documents", permission: "report:read", icon: FileText },
      {
        title: "Verify document",
        titleKey: "nav.verifyDocument",
        href: "/verify",
        permission: "report:read",
        icon: ShieldCheck,
      },
      {
        title: "Roles & Permissions",
        titleKey: "nav.rolesPermissions",
        href: "/rbac",
        permission: "sm:roles:read",
        icon: ShieldCheck,
      },
      { title: "Users", titleKey: "nav.users", href: "/users", permission: "sm:users:read", icon: UserCog },
      { title: "Audit", titleKey: "nav.audit", href: "/audit", permission: "sm:audit:read", icon: ScrollText },
      {
        title: "Feature Flags",
        titleKey: "nav.featureFlags",
        href: "/feature-flags",
        permission: "sm:modules:read",
        icon: ToggleLeft,
      },
      {
        title: "System Parameters",
        titleKey: "nav.systemParameters",
        href: "/system-parameters",
        permission: "sm:sysparams:read",
        icon: SlidersHorizontal,
      },
    ],
  },
];

// Pure filtering logic lives in `permissions-core.ts` (no React/Next pull-in).
// Re-exported so existing imports from this module keep working.
export { filterNavByPermissions } from "./permissions-core";
