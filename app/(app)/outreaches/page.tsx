import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { OutreachesView, type OutreachRow } from "./outreaches-view";

export const metadata = { title: "Outreaches" };

export default async function OutreachesPage() {
  await requireProfile();
  const supabase = await createClient();
  const [{ data: outreaches }, { data: profiles }] = await Promise.all([
    supabase
      .from("outreaches")
      .select(
        `*,
         talent:talents(id, full_name, ig_handle),
         brand:brands(id, name),
         owner:profiles!outreaches_owner_id_fkey(id, full_name)`,
      )
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  const rows: OutreachRow[] = (outreaches ?? []).map((o) => ({
    id: o.id,
    talent_id: o.talent_id,
    brand_id: o.brand_id,
    talent_name: (o as { talent?: { full_name?: string } }).talent?.full_name ?? "—",
    brand_name: (o as { brand?: { name?: string } }).brand?.name ?? "—",
    status: o.status,
    channel: o.channel,
    owner_id: o.owner_id,
    owner_name: (o as { owner?: { full_name?: string } }).owner?.full_name ?? null,
    agreed_amount: o.agreed_amount,
    proposed_amount: o.proposed_amount,
    next_followup_at: o.next_followup_at,
    updated_at: o.updated_at,
    created_at: o.created_at,
  }));

  return (
    <>
      <PageHeader
        title="Outreaches"
        subtitle={`${rows.length} thread${rows.length === 1 ? "" : "s"}`}
      >
        <Button asChild>
          <Link href="/outreaches/new">
            <Plus />
            New outreach
          </Link>
        </Button>
      </PageHeader>
      <OutreachesView
        rows={rows}
        owners={(profiles ?? []).map((p) => ({ id: p.id, name: p.full_name ?? "—" }))}
      />
    </>
  );
}
