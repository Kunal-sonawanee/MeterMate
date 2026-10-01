"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/app/logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import {
  NAV_ITEMS,
  SETTINGS_ITEM,
  isActivePath,
} from "@/components/app/navigation";
import { Button } from "@/components/ui/button";
import { RecordReadingDialog } from "@/components/readings/record-reading-dialog";

/**
 * Application chrome.
 *
 * Three layouts rather than one shrunk down: a rail of icons on tablets, a full
 * sidebar from `lg`, and on phones a top bar plus a bottom tab bar with the
 * primary action promoted into it — recording a reading is the thing people
 * open this app to do, standing in front of a meter.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="bg-primary text-primary-foreground focus:ring-ring sr-only z-100 rounded-lg px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <Sidebar pathname={pathname} />
      <MobileHeader />

      <div className="md:pl-[68px] lg:pl-60">
        <main
          id="main"
          className={cn(
            "mx-auto w-full max-w-[1400px]",
            "px-4 pt-4 pb-24 sm:px-6 md:pt-6 md:pb-10 lg:px-8",
          )}
        >
          {children}
        </main>
      </div>

      <MobileTabBar pathname={pathname} />
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside
      className={cn(
        "bg-card border-border fixed inset-y-0 left-0 z-40 hidden border-r md:flex md:w-[68px] md:flex-col lg:w-60",
      )}
    >
      <div className="flex h-16 items-center px-4 lg:px-5">
        <Link
          href="/"
          className="focus-visible:outline-ring rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="MeterMate — home"
        >
          <span className="lg:hidden">
            <Wordmark className="[&>span:last-child]:hidden" />
          </span>
          <span className="hidden lg:flex">
            <Wordmark />
          </span>
        </Link>
      </div>

      <nav aria-label="Primary" className="flex-1 px-2 lg:px-3">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <SidebarLink
                item={item}
                active={isActivePath(pathname, item.href)}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-border border-t p-2 lg:p-3">
        <SidebarLink
          item={SETTINGS_ITEM}
          active={isActivePath(pathname, SETTINGS_ITEM.href)}
        />
        <div className="mt-3 hidden justify-center lg:flex">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-150",
        "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
        "justify-center lg:justify-start lg:px-3",
        active
          ? "bg-primary-soft text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="hidden lg:inline">{item.label}</span>
    </Link>
  );
}

function MobileHeader() {
  return (
    <header
      className={cn(
        "bg-card/85 border-border sticky top-0 z-30 border-b backdrop-blur-md md:hidden",
        "px-4 pt-[env(safe-area-inset-top)]",
      )}
    >
      <div className="flex h-14 items-center justify-between gap-3">
        <Link
          href="/"
          className="focus-visible:outline-ring rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Wordmark />
        </Link>
        <ThemeToggle size="sm" />
      </div>
    </header>
  );
}

function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "bg-card/90 border-border fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md md:hidden",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="grid grid-cols-3 items-center">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <TabLink item={item} active={isActivePath(pathname, item.href)} />
          </li>
        ))}

        <li className="flex justify-center">
          <RecordReadingDialog
            trigger={
              <Button
                size="icon-lg"
                className="size-12 rounded-full shadow-md"
                aria-label="Record a reading"
              >
                <Plus className="size-5" />
              </Button>
            }
          />
        </li>

        <li>
          <TabLink item={SETTINGS_ITEM} active={isActivePath(pathname, SETTINGS_ITEM.href)} />
        </li>
      </ul>
    </nav>
  );
}

function TabLink({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors duration-150",
        "focus-visible:outline-ring focus-visible:-outline-offset-2 focus-visible:outline-2",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      <span className="text-2xs leading-none font-medium">
        {item.shortLabel ?? item.label}
      </span>
    </Link>
  );
}
