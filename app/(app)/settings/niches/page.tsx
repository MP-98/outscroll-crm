import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { NichesManager } from "./niches-manager";
import type { Niche } from "@/lib/supabase/types";

export const metadata = { title: "Niches · Settings" };

export default async function NichesSettingsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("niches").select("*").order("name");
  return (
    <section className="max-w-lg space-y-4">
      <header>
        <h2 className="text-base font-semibold">Niches</h2>
        <p className="text-xs text-muted-foreground">
          Used across talents and influencers. Anyone can add; only admins can delete.
        </p>
      </header>
      <NichesManager initial={(data ?? []) as Niche[]} canDelete={profile.role === "admin"} />
    </section>
  );
}
