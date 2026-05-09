import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { TalentsTable, type TalentRow } from "./talents-table";

export const metadata = { title: "Talents" };

export default async function TalentsPage() {
  await requireProfile();
  const supabase = await createClient();
  const [{ data: talents }, { data: managers }, { data: niches }] = await Promise.all([
    supabase
      .from("talents")
      .select(
        `*,
         outreaches(id,status,updated_at),
         manager:profiles!talents_manager_id_fkey(id, full_name)`,
      )
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("niches").select("name").order("name"),
  ]);

  const rows: TalentRow[] = (talents ?? []).map((t) => {
    const ors = (t as { outreaches?: Array<{ status: string; updated_at: string }> }).outreaches ?? [];
    const active = ors.filter(
      (o) => !["paid", "lost", "on_hold"].includes(o.status),
    ).length;
    const lastActivity = ors
      .map((o) => o.updated_at)
      .sort()
      .pop();
    return {
      id: t.id,
      full_name: t.full_name,
      ig_handle: t.ig_handle,
      ig_followers: t.ig_followers,
      avg_reel_views: t.avg_reel_views,
      niches: t.niches ?? [],
      city: t.city,
      status: t.status,
      exclusivity: t.exclusivity,
      manager_name: (t as { manager?: { full_name?: string | null } }).manager?.full_name ?? null,
      manager_id: t.manager_id,
      active_outreaches: active,
      last_activity: lastActivity ?? null,
    };
  });

  return (
    <>
      <PageHeader title="Talents" subtitle={`${rows.length} on roster`}>
        <Button asChild>
          <Link href="/talents/new">
            <Plus />
            New talent
          </Link>
        </Button>
      </PageHeader>
      <TalentsTable
        rows={rows}
        managers={(managers ?? []).map((m) => ({ id: m.id, name: m.full_name ?? "—" }))}
        niches={(niches ?? []).map((n) => n.name)}
      />
    </>
  );
}
