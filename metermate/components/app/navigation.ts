import { LayoutDashboard, Settings } from "lucide-react";

/** One nav definition, used by the sidebar, the mobile bar and the page titles. */
export type NavItem = {
  href: string;
  label: string;
  /** Shorter form for the mobile bar, where space is tight. */
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

/**
 * Just Home and Settings — Readings folded into Home (its history sheet), so
 * there's one destination for the thing this app is actually for, not two
 * that did almost the same job.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: LayoutDashboard,
    description: "Record this month's readings",
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
