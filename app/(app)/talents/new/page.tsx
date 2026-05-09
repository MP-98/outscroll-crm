import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { TalentForm } from "@/components/forms/talent-form";

export const metadata = { title: "New talent" };

export default async function NewTalentPage() {
  await requireProfile();
  const supabase = await createClient();
  const [{ data: managers }, { data: niches }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("niches").select("name").order("name"),
  ]);
  return (
    <>
      <PageHeader title="New talent" subtitle="Add a creator to the roster." />
      <div className="px-5 py-5 max-w-3xl">
        <TalentForm
          managers={(managers ?? []).map((m) => ({ id: m.id, name: m.full_name ?? m.id }))}
          niches={(niches ?? []).map((n) => n.name)}
        />
      </div>
    </>
  );
}
