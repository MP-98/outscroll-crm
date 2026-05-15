import type { Profile } from "@/lib/supabase/types";

export type SidebarKey =
  | "dashboard"
  | "inbox"
  | "talents"
  | "outreaches"
  | "managed_brands"
  | "campaigns"
  | "influencers";

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
  { key: "managed_brands", href: "/managed-brands", label: "Managed brands" },
  { key: "campaigns", href: "/campaigns", label: "Campaigns" },
  { key: "influencers", href: "/influencers", label: "Influencers" },
];

/** Default sidebar for newly created users (members AND admins).
 *  Only the seed admin starts with full access; everyone else gets a
 *  configurable subset that defaults to the two operational tabs. */
export const DEFAULT_SIDEBAR: SidebarKey[] = ["outreaches", "influencers"];

/** Back-compat alias — older code paths used DEFAULT_MEMBER_SIDEBAR. */
export const DEFAULT_MEMBER_SIDEBAR = DEFAULT_SIDEBAR;

/** Set of sidebar keys this profile is allowed to access. */
export function allowedSidebar(profile: Profile): Set<SidebarKey> {
  // Seed admin always has everything — no way to lock them out by mistake.
  if (profile.is_seed_admin) {
    return new Set(SIDEBAR_ITEMS.map((i) => i.key));
  }
  // Everyone else (admin + member) respects their allowed_sidebar.
  const raw = profile.allowed_sidebar ?? DEFAULT_SIDEBAR;
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
  {
    test: (p) => p === "/managed-brands" || p.startsWith("/managed-brands/"),
    key: "managed_brands",
  },
  { test: (p) => p === "/campaigns" || p.startsWith("/campaigns/"), key: "campaigns" },
  { test: (p) => p === "/influencers" || p.startsWith("/influencers/"), key: "influencers" },
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
  if (profile.is_seed_admin) return true;
  const key = sidebarKeyFor(pathname);
  if (!key) return true; // Non-gated paths (e.g. /settings/profile)
  return allowedSidebar(profile).has(key);
}

/** Whether this profile is allowed to change others' tab permissions / roles. */
export function canConfigureTeam(profile: Profile): boolean {
  if (profile.is_seed_admin) return true;
  return profile.role === "admin" && profile.can_configure_team;
}
