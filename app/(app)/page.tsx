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

  const [
    { count: outreachCreated },
    { count: priorOutreachCreated },
    { count: activitiesLogged },
    { count: priorActivitiesLogged },
    { count: dueToday },
    { data: idleTalents },
    { data: profiles },
    { data: recentActivities },
    { data: outreachRows },
  ] = await Promise.all([
    supabase
      .from("outreaches")
      .select("id", { count: "exact", head: true })
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("outreaches")
      .select("id", { count: "exact", head: true })
      .gte("created_at", prior.start.toISOString())
      .lte("created_at", prior.end.toISOString()),
    supabase
      .from("outreach_activities")
      .select("id", { count: "exact", head: true })
      .gte("occurred_at", start.toISOString())
      .lte("occurred_at", end.toISOString()),
    supabase
      .from("outreach_activities")
      .select("id", { count: "exact", head: true })
      .gte("occurred_at", prior.start.toISOString())
      .lte("occurred_at", prior.end.toISOString()),
    supabase
      .from("outreaches")
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
      .from("outreaches")
      .select("id, owner_id, created_at"),
  ]);

  // Idle talents = no outreach activity in 14d.
  let idleCount = 0;
  for (const t of idleTalents ?? []) {
    const ors = (t as { outreaches?: Array<{ updated_at: string }> }).outreaches ?? [];
    const last = ors.map((o) => o.updated_at).sort().pop();
    if (!last || last < fourteenDaysAgo) idleCount += 1;
  }

  // Per-user leaderboard for the period.
  const periodStart = start.toISOString();
  const periodEnd = end.toISOString();
  const leaderboard = (profiles ?? []).map((p) => {
    const created = (outreachRows ?? []).filter(
      (o) => o.owner_id === p.id && o.created_at >= periodStart && o.created_at <= periodEnd,
    ).length;
    const acts = (recentActivities ?? []).filter(
      (a) => a.author_id === p.id && a.occurred_at >= periodStart && a.occurred_at <= periodEnd,
    ).length;
    return {
      id: p.id,
      full_name: p.full_name ?? "—",
      outreaches_created: created,
      activities_logged: acts,
    };
  }).sort((a, b) => b.activities_logged - a.activities_logged || b.outreaches_created - a.outreaches_created);

  // Per-talent activity (last 7 days).
  const perTalent: Record<string, { id: string; name: string; brands: Set<string>; last_at: string | null }> = {};
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

  return {
    period,
    cards: {
      outreaches_created: outreachCreated ?? 0,
      prior_outreaches_created: priorOutreachCreated ?? 0,
      activities_logged: activitiesLogged ?? 0,
      prior_activities_logged: priorActivitiesLogged ?? 0,
      due_today: dueToday ?? 0,
      idle_talents: idleCount,
    },
    leaderboard,
    per_talent: perTalentArr,
  };
}

export default async function DashboardPage({ searchParams }: Props) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const period = sp.period ?? "this_week";
  const data = await getData(period);
  return (
    <>
      <PageHeader title={`Hi, ${profile.full_name?.split(" ")[0] ?? "team"}`} subtitle="Activity-first overview." />
      <DashboardView data={data} />
    </>
  );
}
