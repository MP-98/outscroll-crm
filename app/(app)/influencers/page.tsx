import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { InfluencersTable, type InfluencerRow } from "./influencers-table";

export const metadata = { title: "Influencers" };

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

export default async function InfluencersPage() {
  await requireProfile();
  const supabase = await createClient();
  const [{ data: influencers }, { data: niches }] = await Promise.all([
    supabase
      .from("external_influencers")
      .select(`*, campaign_outreaches(id, updated_at)`)
      .order("created_at", { ascending: false }),
    supabase.from("niches").select("name").order("name"),
  ]);

  const rows: InfluencerRow[] = (influencers ?? []).map((i) => {
    const cos =
      (i as { campaign_outreaches?: Array<{ updated_at: string }> }).campaign_outreaches ?? [];
    const lastActivity = cos.map((c) => c.updated_at).sort().pop();
    // Commercial status is derived: any rate filled (collab/non-collab/story/post)
    // counts as Received. Otherwise Pending.
    const hasAnyRate =
      hasText(i.rate_reel) ||
      hasText(i.rate_reel_non_collab) ||
      hasText(i.rate_story) ||
      hasText(i.rate_post);
    return {
      id: i.id,
      full_name: i.full_name,
      ig_handle: i.ig_handle,
      ig_followers: i.ig_followers,
      avg_reel_views: i.avg_reel_views,
      niches: i.niches ?? [],
      city: i.city,
      rate_reel: i.rate_reel,
      rate_story: i.rate_story,
      rate_post: i.rate_post,
      tags: i.tags ?? [],
      notes: i.notes,
      commercial_status: hasAnyRate ? "received" : "pending",
      campaign_count: cos.length,
      last_activity: lastActivity ?? null,
    };
  });

  return (
    <>
      <PageHeader
        title="Influencers"
        subtitle={`${rows.length} in pool — separate from your talent roster`}
      >
        <Button asChild>
          <Link href="/influencers/new">
            <Plus />
            New influencer
          </Link>
        </Button>
      </PageHeader>
      <InfluencersTable rows={rows} niches={(niches ?? []).map((n) => n.name)} />
    </>
  );
}
