import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { RouteGuard } from "@/components/shell/route-guard";
import { requireProfile } from "@/lib/auth";
import { visibleSidebarItems } from "@/lib/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const sidebarItems = visibleSidebarItems(profile);

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      <RouteGuard profile={profile} />
      <Sidebar items={sidebarItems} />
      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        <Topbar profile={profile} />
        <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
