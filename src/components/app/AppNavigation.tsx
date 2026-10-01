"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    label: "Main",
    links: [
      { label: "Dashboard", href: "/dashboard", icon: "home" },
      { label: "Channels", href: "/dashboard/boards", icon: "channels" },
      { label: "Messages", href: "/dashboard/messenger", icon: "messages" },
      { label: "AI Assistant", href: "/dashboard/ai", icon: "ai" },
    ],
  },
  {
    label: "Work",
    links: [
      { label: "Tasks", href: "/dashboard/tasks", icon: "tasks" },
      { label: "Activity", href: "/dashboard/activity", icon: "activity" },
    ],
  },
  {
    label: "Utility",
    links: [
      { label: "Search", href: "/dashboard/search", icon: "search" },
      { label: "Settings", href: "/dashboard/settings", icon: "settings" },
    ],
  },
  {
    label: "User",
    links: [{ label: "Profile", href: "/dashboard/profile", icon: "profile" }],
  },
] as const;

type IconName = (typeof sections)[number]["links"][number]["icon"];

function NavigationIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    channels: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></>,
    messages: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
    ai: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14z" /></>,
    tasks: <><rect x="4" y="4" width="16" height="17" rx="2" /><path d="m8 10 2 2 4-4M8 16h8" /></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 1.9z" transform="translate(-1 -1)" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      {paths[name]}
    </svg>
  );
}

export default function AppNavigation({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  const mobile = variant === "mobile";

  return (
    <nav
      aria-label="Application navigation"
      className={mobile ? "overflow-x-auto" : "space-y-6"}
    >
      {sections.map((section) => (
        <section key={section.label} className={mobile ? "inline" : "block"}>
          {!mobile && (
            <h2 className="mb-2 px-3 text-xs font-semibold uppercase text-muted">
              {section.label}
            </h2>
          )}
          <ul className={mobile ? "flex min-w-max gap-1" : "space-y-1"}>
            {section.links.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                      active
                        ? "bg-surface-muted font-semibold text-foreground"
                        : "text-muted hover:bg-surface-hover hover:text-foreground"
                    }`}
                  >
                    <NavigationIcon name={link.icon} />
                    <span>{link.label}</span>
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