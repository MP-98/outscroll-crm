import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { CampaignForm } from "@/components/forms/campaign-form";

interface Props {
  searchParams: Promise<{ managed_brand_id?: string }>;
}

export const metadata = { title: "New campaign" };

export default async function NewCampaignPage({ searchParams }: Props) {
  const me = await requireProfile();
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: managedBrands }, { data: managers }] = await Promise.all([
    supabase
      .from("managed_brands")
      .select("id, name")
      .neq("status", "churned")
      .order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  return (
    <>
      <PageHeader
        title="New campaign"
        subtitle="A campaign for a managed brand. Add influencers after creation."
      />
      <div className="px-5 py-5">
        <CampaignForm
          managedBrands={(managedBrands ?? []).map((b) => ({ id: b.id, label: b.name }))}
          managers={(managers ?? []).map((m) => ({
            id: m.id,
            label: m.full_name ?? "—",
          }))}
          currentUserId={me.id}
          defaultManagedBrandId={sp.managed_brand_id}
        />
      </div>
    </>
  );
}
