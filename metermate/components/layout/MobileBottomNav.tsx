import { CircleDollarSign, LayoutDashboard, Settings, Tablets } from "lucide-react";

const navItems = [
  { href: "#dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "#readings", label: "Readings", icon: CircleDollarSign },
  { href: "#meters", label: "Meters", icon: Tablets },
  { href: "#settings", label: "Settings", icon: Settings },
];

export default function MobileBottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-medium text-slate-600 transition active:scale-95"
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}