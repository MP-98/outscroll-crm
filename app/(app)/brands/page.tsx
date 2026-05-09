import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { BrandsTable, type BrandRow } from "./brands-table";

export const metadata = { title: "Brands" };

export default async function BrandsPage() {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("brands")
    .select(`*, outreaches(id,status,updated_at)`)
    .order("created_at", { ascending: false });

  const rows: BrandRow[] = (data ?? []).map((b) => {
    const ors = (b as { outreaches?: Array<{ status: string; updated_at: string }> }).outreaches ?? [];
    const active = ors.filter((o) => !["paid", "lost", "on_hold"].includes(o.status)).length;
    const closed = ors.filter((o) => ["confirmed", "live", "paid"].includes(o.status)).length;
    const lastContacted = ors.map((o) => o.updated_at).sort().pop();
    return {
      id: b.id,
      name: b.name,
      industry: b.industry,
      ig_handle: b.ig_handle,
      website: b.website,
      tags: b.tags ?? [],
      active_outreaches: active,
      lifetime_closed: closed,
      last_contacted: lastContacted ?? null,
    };
  });

  return (
    <>
      <PageHeader title="Brands" subtitle={`${rows.length} brand${rows.length === 1 ? "" : "s"}`}>
        <Button asChild>
          <Link href="/brands/new">
            <Plus />
            New brand
          </Link>
        </Button>
      </PageHeader>
      <BrandsTable rows={rows} />
    </>
  );
}
