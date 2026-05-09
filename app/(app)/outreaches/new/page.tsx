import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { OutreachForm } from "@/components/forms/outreach-form";

export const metadata = { title: "New outreach" };

interface Props {
  searchParams: Promise<{ talent_id?: string; brand_id?: string }>;
}

export default async function NewOutreachPage({ searchParams }: Props) {
  await requireProfile();
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: talents }, { data: brands }, { data: managers }] = await Promise.all([
    supabase.from("talents").select("id, full_name, ig_handle").order("full_name"),
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  return (
    <>
      <PageHeader title="New outreach" subtitle="A talent ↔ brand thread." />
      <div className="px-5 py-5">
        <OutreachForm
          talents={(talents ?? []).map((t) => ({ id: t.id, label: `${t.full_name} · @${t.ig_handle}` }))}
          brands={(brands ?? []).map((b) => ({ id: b.id, label: b.name }))}
          managers={(managers ?? []).map((m) => ({ id: m.id, label: m.full_name ?? "—" }))}
          defaultTalentId={sp.talent_id}
          defaultBrandId={sp.brand_id}
        />
      </div>
    </>
  );
}
