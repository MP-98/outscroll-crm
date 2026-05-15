import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { InfluencerForm } from "@/components/forms/influencer-form";

export const metadata = { title: "New influencer" };

export default async function NewInfluencerPage() {
  await requireProfile();
  const supabase = await createClient();
  const { data: niches } = await supabase.from("niches").select("name").order("name");
  return (
    <>
      <PageHeader
        title="New influencer"
        subtitle="Add a nano/micro creator to the external pool (separate from your talent roster)."
      />
      <div className="px-5 py-5">
        <InfluencerForm niches={(niches ?? []).map((n) => n.name)} />
      </div>
    </>
  );
}
