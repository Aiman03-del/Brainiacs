"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAVIGATION, findNavigationItem } from "@/lib/navigation";

interface AppNavigationProps {
  collapsed?: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
}

export default function AppNavigation({
  collapsed = false,
  mobile = false,
  onNavigate,
}: AppNavigationProps) {
  const pathname = usePathname();
  const activeItem = findNavigationItem(pathname);
  const groups = APP_NAVIGATION.filter((group) => group.placement !== "bottom");

  return (
    <nav
      aria-label="Application navigation"
      className={`min-h-0 flex-1 overflow-y-auto ${mobile ? "space-y-5" : "space-y-6"}`}
    >
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          {!collapsed && (
            <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
              {group.label}
            </h2>
          )}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = activeItem?.href === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex ${mobile ? "min-h-11" : "min-h-10"} items-center gap-3 rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      collapsed ? "justify-center px-0" : ""
                    } ${
                      active
                        ? "bg-surface-muted font-semibold text-foreground"
                        : "text-muted hover:bg-surface-hover hover:text-foreground"
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                    <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate"}>
                      {item.label}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && !collapsed && (
                      <span className="rounded-full bg-danger px-1.5 py-0.5 text-xs font-semibold leading-none text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                    {item.badge !== undefined && item.badge > 0 && collapsed && (
                      <span
                        className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger"
                        aria-label={`${item.badge} notifications`}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}