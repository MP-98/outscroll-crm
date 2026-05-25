import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { InfluencerForm } from "@/components/forms/influencer-form";

export const metadata = { title: "New influencer" };

export default async function NewInfluencerPage() {
  await requireProfile();
  const supabase = await createClient();
  const [{ data: niches }, { data: tagRows }] = await Promise.all([
    supabase.from("niches").select("name").order("name"),
    supabase.from("external_influencers").select("tags").not("tags", "is", null),
  ]);

  // Dedup tags case-insensitively, keep the first-seen casing.
  const seen = new Map<string, string>();
  for (const row of tagRows ?? []) {
    for (const t of (row.tags as string[] | null) ?? []) {
      const key = t.toLowerCase();
      if (!seen.has(key)) seen.set(key, t);
    }
  }
  const existingTags = Array.from(seen.values()).sort();

  return (
    <>
      <PageHeader
        title="New influencer"
        subtitle="Add a nano/micro creator to the external pool (separate from your talent roster)."
      />
      <div className="px-5 py-5">
        <InfluencerForm
          niches={(niches ?? []).map((n) => n.name)}
          existingTags={existingTags}
        />
      </div>
    </>
  );
}
