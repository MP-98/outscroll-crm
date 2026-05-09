"use client";

import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Inbox,
  Users,
  Building2,
  MessagesSquare,
  Plus,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Talents", href: "/talents", icon: Users },
  { label: "Brands", href: "/brands", icon: Building2 },
  { label: "Outreaches", href: "/outreaches", icon: MessagesSquare },
  { label: "Settings", href: "/settings", icon: Settings },
];

const CREATE_ITEMS = [
  { label: "New talent", href: "/talents/new" },
  { label: "New brand", href: "/brands/new" },
  { label: "New outreach", href: "/outreaches/new" },
];

export function CommandPalette({ open, onOpenChange }: PaletteProps) {
  const router = useRouter();
  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl overflow-hidden">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command label="Command palette" className="bg-popover">
          <Command.Input
            placeholder="Type a command or search…"
            className="w-full px-4 py-3 text-sm bg-transparent border-b border-border outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-xs text-muted-foreground">
              No results.
            </Command.Empty>
            <Command.Group heading="Navigate" className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 pt-2 pb-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.href}
                    onSelect={() => go(item.href)}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground data-[selected=true]:bg-accent cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                );
              })}
            </Command.Group>
            <Command.Group heading="Create" className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 pt-3 pb-1">
              {CREATE_ITEMS.map((item) => (
                <Command.Item
                  key={item.href}
                  onSelect={() => go(item.href)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground data-[selected=true]:bg-accent cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
