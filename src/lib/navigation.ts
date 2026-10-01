import {
  Activity,
  Bot,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  MessagesSquare,
  Search,
  Settings,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export interface AppNavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export interface AppNavigationGroup {
  label: string;
  items: AppNavigationItem[];
  placement?: "main" | "bottom";
}

export const APP_NAVIGATION: AppNavigationGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Channels", href: "/dashboard/boards", icon: MessagesSquare },
      { label: "Messages", href: "/dashboard/messenger", icon: MessageSquare },
      { label: "AI Assistant", href: "/dashboard/ai", icon: Bot },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Tasks", href: "/dashboard/tasks", icon: ListChecks },
      { label: "Activity", href: "/dashboard/activity", icon: Activity },
    ],
  },
  {
    label: "Utility",
    items: [
      { label: "Search", href: "/dashboard/search", icon: Search },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
  {
    label: "Account",
    placement: "bottom",
    items: [{ label: "Profile", href: "/dashboard/profile", icon: UserCircle }],
  },
];

export function findNavigationItem(pathname: string): AppNavigationItem | undefined {
  return APP_NAVIGATION.flatMap((group) => group.items)
    .filter(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)),
    )
    .sort((left, right) => right.href.length - left.href.length)[0];
}