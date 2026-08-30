import {
  Building2,
  Gauge,
  LayoutDashboard,
  ListOrdered,
  Settings,
} from "lucide-react";

/** One nav definition, used by the sidebar, the mobile bar and the page titles. */
export type NavItem = {
  href: string;
  label: string;
  /** Shorter form for the mobile bar, where space is tight. */
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Overview",
    icon: LayoutDashboard,
    description: "This cycle at a glance",
  },
  {
    href: "/readings",
    label: "Readings",
    icon: ListOrdered,
    description: "Every reading you've recorded",
  },
  {
    href: "/meters",
    label: "Meters",
    icon: Gauge,
    description: "Meters and their usage",
  },
  {
    href: "/properties",
    label: "Properties",
    icon: Building2,
    description: "Places you bill for",
  },
];

export const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
  description: "Defaults and appearance",
};

/** Marks the deepest matching nav item, so `/meters/abc` highlights Meters. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
