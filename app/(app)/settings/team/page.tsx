import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { TeamManager } from "./team-manager";
import type { Profile } from "@/lib/supabase/types";

export const metadata = { title: "Team · Settings" };

export default async function TeamSettingsPage() {
  const me = await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  return (
    <section className="max-w-3xl space-y-4">
      <header>
        <h2 className="text-base font-semibold">Team</h2>
        <p className="text-xs text-muted-foreground">
          Create teammate accounts with an initial password. Configure which tabs each member can access.
        </p>
      </header>
      <TeamManager
        initial={(data ?? []) as Profile[]}
        currentUserId={me.id}
        meIsSeedAdmin={me.is_seed_admin}
        meCanConfigure={me.is_seed_admin || me.can_configure_team}
      />
    </section>
  );
}
