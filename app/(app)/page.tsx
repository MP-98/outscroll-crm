import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { DashboardView, type DashboardData } from "./dashboard-view";
import { rangeFor, priorRange, todayISO } from "@/lib/date";
import { subDays } from "date-fns";

export const metadata = { title: "Dashboard · Outscroll" };

interface Props {
  searchParams: Promise<{ period?: "today" | "this_week" | "last_7d" }>;
}

async function getData(period: "today" | "this_week" | "last_7d"): Promise<DashboardData> {
  const supabase = await createClient();
  const { start, end } = rangeFor(period);
  const prior = priorRange(period);
  const today = todayISO();
  const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

  const periodStart = start.toISOString();
  const periodEnd = end.toISOString();
  const priorStart = prior.start.toISOString();
  const priorEnd = prior.end.toISOString();

  const [
    // Counts: outreach create (talent-side)
    { count: outreachCreated },
    { count: priorOutreachCreated },
    // Counts: campaign-outreach create (brand-managed side)
    { count: campOutreachCreated },
    { count: priorCampOutreachCreated },
    // Activities (talent side)
    { count: activitiesLogged },
    { count: priorActivitiesLogged },
    // Activities (campaign side)
    { count: campActivitiesLogged },
    { count: priorCampActivitiesLogged },
    // Follow-ups due today (both sides)
    { count: dueTodayTalent },
    { count: dueTodayCampaign },
    // Idle talents
    { data: idleTalents },
    // Leaderboard / per-talent inputs
    { data: profiles },
    { data: recentActivities },
    { data: recentCampActivities },
    { data: outreachRows },
    { data: campOutreachRows },
    // Active campaigns
    { data: activeCampaigns },
  ] = await Promise.all([
    supabase
      .from("outreaches")
      .select("id", { count: "exact", head: true })
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd),
    supabase
      .from("outreaches")
      .select("id", { count: "exact", head: true })
      .gte("created_at", priorStart)
      .lte("created_at", priorEnd),
    supabase
      .from("campaign_outreaches")
      .select("id", { count: "exact", head: true })
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd),
    supabase
      .from("campaign_outreaches")
      .select("id", { count: "exact", head: true })
      .gte("created_at", priorStart)
      .lte("created_at", priorEnd),
    supabase
      .from("outreach_activities")
      .select("id", { count: "exact", head: true })
      .gte("occurred_at", periodStart)
      .lte("occurred_at", periodEnd),
    supabase
      .from("outreach_activities")
      .select("id", { count: "exact", head: true })
      .gte("occurred_at", priorStart)
      .lte("occurred_at", priorEnd),
    supabase
      .from("campaign_outreach_activities")
      .select("id", { count: "exact", head: true })
      .gte("occurred_at", periodStart)
      .lte("occurred_at", periodEnd),
    supabase
      .from("campaign_outreach_activities")
      .select("id", { count: "exact", head: true })
      .gte("occurred_at", priorStart)
      .lte("occurred_at", priorEnd),
    supabase
      .from("outreaches")
      .select("id", { count: "exact", head: true })
      .eq("next_followup_at", today)
      .neq("status", "paid")
      .neq("status", "lost"),
    supabase
      .from("campaign_outreaches")
      .select("id", { count: "exact", head: true })
      .eq("next_followup_at", today)
      .neq("status", "paid")
      .neq("status", "lost"),
    supabase
      .from("talents")
      .select(`id, full_name, ig_handle, outreaches(updated_at)`)
      .eq("status", "active"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase
      .from("outreach_activities")
      .select(
        `id, author_id, occurred_at,
         outreach:outreaches!inner(id, talent_id, brand_id,
           talent:talents(id, full_name),
           brand:brands(id, name))`,
      )
      .gte("occurred_at", subDays(new Date(), 7).toISOString())
      .order("occurred_at", { ascending: false })
      .limit(500),
    supabase
      .from("campaign_outreach_activities")
      .select("id, author_id, occurred_at")
      .gte("occurred_at", subDays(new Date(), 7).toISOString())
      .limit(500),
    supabase.from("outreaches").select("id, owner_id, created_at"),
    supabase
      .from("campaign_outreaches")
      .select("id, owner_id, created_at"),
    supabase
      .from("campaigns")
      .select(
        `id, name, status,
         managed_brand:managed_brands(id, name),
         campaign_outreaches(id, status, payment_status)`,
      )
      .eq("status", "live")
      .order("name"),
  ]);

  // Idle talents = no outreach activity in 14d.
  let idleCount = 0;
  for (const t of idleTalents ?? []) {
    const ors = (t as { outreaches?: Array<{ updated_at: string }> }).outreaches ?? [];
    const last = ors.map((o) => o.updated_at).sort().pop();
    if (!last || last < fourteenDaysAgo) idleCount += 1;
  }

  // Per-user leaderboard for the period (both sides).
  const leaderboard = (profiles ?? [])
    .map((p) => {
      const talentCreated = (outreachRows ?? []).filter(
        (o) =>
          o.owner_id === p.id &&
          o.created_at >= periodStart &&
          o.created_at <= periodEnd,
      ).length;
      const talentActs = (recentActivities ?? []).filter(
        (a) =>
          a.author_id === p.id &&
          a.occurred_at >= periodStart &&
          a.occurred_at <= periodEnd,
      ).length;
      const campCreated = (campOutreachRows ?? []).filter(
        (o) =>
          o.owner_id === p.id &&
          o.created_at >= periodStart &&
          o.created_at <= periodEnd,
      ).length;
      const campActs = (recentCampActivities ?? []).filter(
        (a) =>
          a.author_id === p.id &&
          a.occurred_at >= periodStart &&
          a.occurred_at <= periodEnd,
      ).length;
      return {
        id: p.id,
        full_name: p.full_name ?? "—",
        talent_outreaches: talentCreated,
        talent_activities: talentActs,
        campaign_outreaches: campCreated,
        campaign_activities: campActs,
      };
    })
    .sort(
      (a, b) =>
        b.talent_activities +
        b.campaign_activities -
        (a.talent_activities + a.campaign_activities) ||
        b.talent_outreaches +
          b.campaign_outreaches -
          (a.talent_outreaches + a.campaign_outreaches),
    );

  // Per-talent activity (last 7 days, talent-side only).
  const perTalent: Record<
    string,
    { id: string; name: string; brands: Set<string>; last_at: string | null }
  > = {};
  for (const a of recentActivities ?? []) {
    type Joined = {
      outreach?: {
        talent_id?: string;
        talent?: { id: string; full_name?: string } | null;
        brand?: { id: string; name?: string } | null;
      } | null;
    };
    const o = (a as Joined).outreach;
    if (!o?.talent?.id) continue;
    const tid = o.talent.id;
    perTalent[tid] ??= {
      id: tid,
      name: o.talent.full_name ?? "—",
      brands: new Set(),
      last_at: null,
    };
    if (o.brand?.id) perTalent[tid].brands.add(o.brand.id);
    if (!perTalent[tid].last_at || a.occurred_at > perTalent[tid].last_at) {
      perTalent[tid].last_at = a.occurred_at;
    }
  }
  const perTalentArr = Object.values(perTalent)
    .map((t) => ({
      id: t.id,
      name: t.name,
      brands_pitched: t.brands.size,
      last_at: t.last_at,
    }))
    .sort((a, b) => b.brands_pitched - a.brands_pitched);

  // Active campaigns row (per managed brand).
  type ActiveCampaign = {
    id: string;
    name: string;
    managed_brand_id: string;
    managed_brand_name: string;
    contacted: number;
    confirmed: number;
    paid: number;
  };
  const activeCampaignList: ActiveCampaign[] = (activeCampaigns ?? []).map(
    (c: { id: string; name: string; managed_brand: unknown; campaign_outreaches?: Array<{ status: string; payment_status: string }> }) => {
      const mb = Array.isArray(c.managed_brand)
        ? (c.managed_brand[0] as { id: string; name: string } | undefined)
        : (c.managed_brand as { id: string; name: string } | null);
      const cos = c.campaign_outreaches ?? [];
      return {
        id: c.id,
        name: c.name,
        managed_brand_id: mb?.id ?? "",
        managed_brand_name: mb?.name ?? "—",
        contacted: cos.filter((o) =>
          [
            "contacted",
            "in_conversation",
            "negotiating",
            "confirmed",
            "live",
            "paid",
          ].includes(o.status),
        ).length,
        confirmed: cos.filter((o) =>
          ["confirmed", "live", "paid"].includes(o.status),
        ).length,
        paid: cos.filter((o) => o.payment_status === "paid").length,
      };
    },
  );

  return {
    period,
    cards: {
      outreaches_created: (outreachCreated ?? 0) + (campOutreachCreated ?? 0),
      prior_outreaches_created:
        (priorOutreachCreated ?? 0) + (priorCampOutreachCreated ?? 0),
      activities_logged:
        (activitiesLogged ?? 0) + (campActivitiesLogged ?? 0),
      prior_activities_logged:
        (priorActivitiesLogged ?? 0) + (priorCampActivitiesLogged ?? 0),
      due_today: (dueTodayTalent ?? 0) + (dueTodayCampaign ?? 0),
      idle_talents: idleCount,
    },
    leaderboard,
    per_talent: perTalentArr,
    active_campaigns: activeCampaignList,
  };
}

export default async function DashboardPage({ searchParams }: Props) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const period = sp.period ?? "this_week";
  const data = await getData(period);
  return (
    <>
      <PageHeader
        title={`Hi, ${profile.full_name?.split(" ")[0] ?? "team"}`}
        subtitle="Activity-first overview across both sides."
      />
      <DashboardView data={data} />
    </>
  );
}
