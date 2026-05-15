import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { CampaignsView, type CampaignRow } from "./campaigns-view";

export const metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  await requireProfile();
  const supabase = await createClient();
  const [{ data: campaigns }, { data: managedBrands }] = await Promise.all([
    supabase
      .from("campaigns")
      .select(
        `*,
         managed_brand:managed_brands(id, name),
         campaign_outreaches(id, status, payment_status)`,
      )
      .order("created_at", { ascending: false }),
    supabase.from("managed_brands").select("id, name").order("name"),
  ]);

  const rows: CampaignRow[] = (campaigns ?? []).map((c) => {
    const cos =
      (c as {
        campaign_outreaches?: Array<{ status: string; payment_status: string }>;
      }).campaign_outreaches ?? [];
    return {
      id: c.id,
      name: c.name,
      managed_brand_id: c.managed_brand_id,
      managed_brand_name:
        (c as { managed_brand?: { name?: string } }).managed_brand?.name ?? "—",
      status: c.status,
      budget: c.budget,
      starts_on: c.starts_on,
      ends_on: c.ends_on,
      total_outreaches: cos.length,
      confirmed_outreaches: cos.filter((o) =>
        ["confirmed", "live", "paid"].includes(o.status),
      ).length,
      paid_outreaches: cos.filter((o) => o.payment_status === "paid").length,
      updated_at: c.updated_at,
    };
  });

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle={`${rows.length} across all managed brands`}
      >
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus />
            New campaign
          </Link>
        </Button>
      </PageHeader>
      <CampaignsView
        rows={rows}
        managedBrands={(managedBrands ?? []).map((b) => ({ id: b.id, name: b.name }))}
      />
    </>
  );
}
