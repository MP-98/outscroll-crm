import { PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Workspace and account preferences." />
      <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
        <SettingsNav isAdmin={profile.role === "admin"} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
