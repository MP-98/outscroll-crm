import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { OutreachForm } from "@/components/forms/outreach-form";

export const metadata = { title: "New outreach" };

interface Props {
  searchParams: Promise<{ talent_id?: string; brand_id?: string }>;
}

export default async function NewOutreachPage({ searchParams }: Props) {
  const me = await requireProfile();
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: talents }, { data: brands }, { data: managers }, { data: pocs }] =
    await Promise.all([
      supabase.from("talents").select("id, full_name, ig_handle").order("full_name"),
      supabase.from("brands").select("id, name, industry").order("name"),
      supabase.from("profiles").select("id, full_name").order("full_name"),
      supabase
        .from("brand_pocs")
        .select("id, brand_id, full_name, role_title, email, phone"),
    ]);

  return (
    <>
      <PageHeader title="New outreach" subtitle="A talent ↔ brand thread." />
      <div className="px-5 py-5">
        <OutreachForm
          talents={(talents ?? []).map((t) => ({
            id: t.id,
            label: `${t.full_name} · @${t.ig_handle}`,
          }))}
          brands={(brands ?? []).map((b) => ({
            id: b.id,
            name: b.name,
            industry: b.industry ?? null,
          }))}
          managers={(managers ?? []).map((m) => ({
            id: m.id,
            label: m.full_name ?? "—",
          }))}
          currentUserId={me.id}
          pocs={(pocs ?? []).map((p) => ({
            id: p.id,
            brand_id: p.brand_id,
            full_name: p.full_name,
            role_title: p.role_title ?? null,
            email: p.email ?? null,
            phone: p.phone ?? null,
          }))}
          defaultTalentId={sp.talent_id}
          defaultBrandId={sp.brand_id}
        />
      </div>
    </>
  );
}
