"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Users,
  Building2,
  MessagesSquare,
  Briefcase,
  Megaphone,
  Sparkles,
  Settings,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidebarKey, SidebarItem } from "@/lib/permissions";

const ICONS: Record<SidebarKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  inbox: Inbox,
  talents: Users,
  brands: Building2,
  outreaches: MessagesSquare,
};

const PHASE2_ITEMS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/managed-brands", label: "Managed brands", icon: Briefcase },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/influencers", label: "Influencers", icon: Sparkles },
];

export function Sidebar({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid place-items-center h-6 w-6 rounded bg-primary text-primary-foreground text-[11px] font-bold">
            O
          </span>
          <span className="text-sm">Outscroll</span>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = ICONS[item.key];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <div className="my-2 h-px bg-border" />
        {PHASE2_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <span
              key={item.href}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground/70 cursor-not-allowed"
              title="Phase 2"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              <span className="text-[10px] uppercase tracking-wider opacity-70">P2</span>
            </span>
          );
        })}
      </nav>
      <div className="px-2 py-3 border-t border-border">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-accent text-foreground font-medium"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
