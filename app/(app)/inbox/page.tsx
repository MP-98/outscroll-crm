import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { InboxView, type InboxItem } from "./inbox-view";
import { todayISO } from "@/lib/date";
import { addDays } from "date-fns";

export const metadata = { title: "Inbox" };

export default async function InboxPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const today = todayISO();
  const sevenDaysOut = addDays(new Date(), 7).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("outreaches")
    .select(
      `id, talent_id, brand_id, channel, status, next_followup_at, owner_id, updated_at,
       talent:talents(id, full_name, ig_handle),
       brand:brands(id, name)`,
    )
    .neq("status", "paid")
    .neq("status", "lost")
    .lte("next_followup_at", sevenDaysOut)
    .order("next_followup_at");

  const items: InboxItem[] = (data ?? []).map((o) => ({
    id: o.id,
    source: "outreach",
    talent_id: o.talent_id,
    brand_id: o.brand_id,
    talent_name: (o as { talent?: { full_name?: string } }).talent?.full_name ?? "—",
    brand_name: (o as { brand?: { name?: string } }).brand?.name ?? "—",
    channel: o.channel,
    status: o.status,
    next_followup_at: o.next_followup_at,
    owner_id: o.owner_id,
    last_activity: o.updated_at,
  }));

  return (
    <>
      <PageHeader title="Inbox" subtitle="Follow-ups due today, overdue, and coming this week." />
      <InboxView items={items} today={today} myUserId={profile.id} />
    </>
  );
}
