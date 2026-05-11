import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { canAccessPath } from "@/lib/permissions";
import type { Profile } from "@/lib/supabase/types";

/**
 * Server-component guard rendered from a layout. Reads the current pathname
 * from `next-url` (set by Next.js for RSC requests) and falls back to the
 * `x-pathname` header set by proxy.ts. If the profile doesn't have access,
 * redirect to the first allowed sidebar item.
 */
export async function RouteGuard({ profile }: { profile: Profile }) {
  const h = await headers();
  const pathname =
    h.get("x-pathname") ||
    h.get("next-url") ||
    "/";
  if (!canAccessPath(profile, pathname)) {
    redirect("/");
  }
  return null;
}
