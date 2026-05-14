import type { Profile } from "@/lib/supabase/types";

export type SidebarKey = "dashboard" | "inbox" | "talents" | "outreaches";

export interface SidebarItem {
  key: SidebarKey;
  href: string;
  label: string;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: "dashboard", href: "/", label: "Dashboard" },
  { key: "inbox", href: "/inbox", label: "Inbox" },
  { key: "talents", href: "/talents", label: "Talents" },
  { key: "outreaches", href: "/outreaches", label: "Outreaches" },
];

export const DEFAULT_MEMBER_SIDEBAR: SidebarKey[] = [
  "dashboard",
  "inbox",
  "talents",
  "outreaches",
];

/** Set of sidebar keys this profile is allowed to access. */
export function allowedSidebar(profile: Profile): Set<SidebarKey> {
  if (profile.role === "admin" || profile.is_seed_admin) {
    return new Set(SIDEBAR_ITEMS.map((i) => i.key));
  }
  const raw = profile.allowed_sidebar ?? DEFAULT_MEMBER_SIDEBAR;
  return new Set(
    raw.filter((k): k is SidebarKey =>
      SIDEBAR_ITEMS.some((i) => i.key === k),
    ),
  );
}

/** Visible sidebar items for this profile, in canonical order. */
export function visibleSidebarItems(profile: Profile): SidebarItem[] {
  const allowed = allowedSidebar(profile);
  return SIDEBAR_ITEMS.filter((i) => allowed.has(i.key));
}

const PATH_TO_KEY: Array<{ test: (p: string) => boolean; key: SidebarKey }> = [
  { test: (p) => p === "/", key: "dashboard" },
  { test: (p) => p === "/inbox" || p.startsWith("/inbox/"), key: "inbox" },
  { test: (p) => p === "/talents" || p.startsWith("/talents/"), key: "talents" },
  { test: (p) => p === "/outreaches" || p.startsWith("/outreaches/"), key: "outreaches" },
];
// Note: /brands/[id] is intentionally non-gated — it's a deep-link target
// reachable only from within the Outreaches experience, not a sidebar tab.

/** Look up the sidebar key for a pathname, or null if it isn't a gated path. */
export function sidebarKeyFor(pathname: string): SidebarKey | null {
  for (const { test, key } of PATH_TO_KEY) {
    if (test(pathname)) return key;
  }
  return null;
}

export function canAccessPath(profile: Profile, pathname: string): boolean {
  if (profile.role === "admin" || profile.is_seed_admin) return true;
  const key = sidebarKeyFor(pathname);
  if (!key) return true; // Non-gated paths (e.g. /settings/profile)
  return allowedSidebar(profile).has(key);
}

/** Whether this profile is allowed to change others' tab permissions / roles. */
export function canConfigureTeam(profile: Profile): boolean {
  if (profile.is_seed_admin) return true;
  return profile.role === "admin" && profile.can_configure_team;
}
