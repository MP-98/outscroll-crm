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

  const [{ data: outreaches }, { data: campaignOutreaches }] = await Promise.all([
    supabase
      .from("outreaches")
      .select(
        `id, channel, status, next_followup_at, owner_id, updated_at,
         talent:talents(id, full_name, ig_handle),
         brand:brands(id, name)`,
      )
      .neq("status", "paid")
      .neq("status", "lost")
      .lte("next_followup_at", sevenDaysOut)
      .order("next_followup_at"),
    supabase
      .from("campaign_outreaches")
      .select(
        `id, channel, status, next_followup_at, owner_id, updated_at,
         campaign:campaigns(id, name),
         external_influencer:external_influencers(id, full_name, ig_handle),
         talent:talents(id, full_name, ig_handle)`,
      )
      .neq("status", "paid")
      .neq("status", "lost")
      .lte("next_followup_at", sevenDaysOut)
      .order("next_followup_at"),
  ]);

  const talentItems: InboxItem[] = (outreaches ?? []).map((o) => {
    const t = (o as { talent?: { full_name?: string } | Array<{ full_name?: string }> }).talent;
    const tt = Array.isArray(t) ? t[0] : t;
    const b = (o as { brand?: { name?: string } | Array<{ name?: string }> }).brand;
    const bb = Array.isArray(b) ? b[0] : b;
    return {
      id: o.id,
      source: "outreach",
      who_name: tt?.full_name ?? "—",
      ref_name: bb?.name ?? "—",
      channel: o.channel,
      status: o.status,
      next_followup_at: o.next_followup_at,
      owner_id: o.owner_id,
      last_activity: o.updated_at,
    };
  });

  const campaignItems: InboxItem[] = (campaignOutreaches ?? []).map((o) => {
    const ext = (
      o as {
        external_influencer?:
          | { full_name?: string | null; ig_handle?: string }
          | Array<{ full_name?: string | null; ig_handle?: string }>
          | null;
      }
    ).external_influencer;
    const e = Array.isArray(ext) ? ext[0] : ext;
    const t = (
      o as {
        talent?:
          | { full_name?: string; ig_handle?: string }
          | Array<{ full_name?: string; ig_handle?: string }>
          | null;
      }
    ).talent;
    const tt = Array.isArray(t) ? t[0] : t;
    const c = (o as { campaign?: { name?: string } | Array<{ name?: string }> }).campaign;
    const cc = Array.isArray(c) ? c[0] : c;
    const who = tt
      ? tt.full_name ?? `@${tt.ig_handle ?? "—"}`
      : e
        ? e.full_name ?? `@${e.ig_handle ?? "—"}`
        : "—";
    return {
      id: o.id,
      source: "campaign",
      who_name: who,
      ref_name: cc?.name ?? "—",
      channel: o.channel ?? "other",
      status: o.status,
      next_followup_at: o.next_followup_at,
      owner_id: o.owner_id,
      last_activity: o.updated_at,
    };
  });

  const items: InboxItem[] = [...talentItems, ...campaignItems].sort(
    (a, b) => a.next_followup_at.localeCompare(b.next_followup_at),
  );

  return (
    <>
      <PageHeader
        title="Inbox"
        subtitle="Follow-ups due today, overdue, and coming this week. Both talent and campaign sides."
      />
      <InboxView items={items} today={today} myUserId={profile.id} />
    </>
  );
}
