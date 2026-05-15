"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  MessagesSquare,
  Activity,
  Clock,
  Snail,
  Megaphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtRelative } from "@/lib/date";
import { cn } from "@/lib/utils";

export interface DashboardData {
  period: "today" | "this_week" | "last_7d";
  cards: {
    outreaches_created: number;
    prior_outreaches_created: number;
    activities_logged: number;
    prior_activities_logged: number;
    due_today: number;
    idle_talents: number;
  };
  leaderboard: Array<{
    id: string;
    full_name: string;
    talent_outreaches: number;
    talent_activities: number;
    campaign_outreaches: number;
    campaign_activities: number;
  }>;
  per_talent: Array<{
    id: string;
    name: string;
    brands_pitched: number;
    last_at: string | null;
  }>;
  active_campaigns: Array<{
    id: string;
    name: string;
    managed_brand_id: string;
    managed_brand_name: string;
    contacted: number;
    confirmed: number;
    paid: number;
  }>;
}

export function DashboardView({ data }: { data: DashboardData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setPeriod(p: DashboardData["period"]) {
    const sp = new URLSearchParams(searchParams);
    sp.set("period", p);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="px-5 py-5 space-y-5">
      <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5">
        {(
          [
            { id: "today", label: "Today" },
            { id: "this_week", label: "This week" },
            { id: "last_7d", label: "Last 7 days" },
          ] as const
        ).map((opt) => (
          <Button
            key={opt.id}
            variant={data.period === opt.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod(opt.id)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <DeltaCard
          icon={<MessagesSquare />}
          label="Outreaches created"
          value={data.cards.outreaches_created}
          delta={data.cards.outreaches_created - data.cards.prior_outreaches_created}
          hint="Talent + campaign"
        />
        <DeltaCard
          icon={<Activity />}
          label="Activities logged"
          value={data.cards.activities_logged}
          delta={data.cards.activities_logged - data.cards.prior_activities_logged}
          hint="Both sides"
        />
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Follow-ups due today
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold tabular-nums">
                {data.cards.due_today}
              </span>
              <Link href="/inbox" className="text-xs text-primary hover:underline">
                Open inbox →
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Snail className="h-3.5 w-3.5" />
              Talents idle 14d+
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold tabular-nums">
                {data.cards.idle_talents}
              </span>
              <Link href="/talents?stale=14" className="text-xs text-primary hover:underline">
                View →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active campaigns row */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Active campaigns
            <Badge variant="outline">{data.active_campaigns.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.active_campaigns.length === 0 ? (
            <p className="px-4 py-6 text-xs text-muted-foreground text-center">
              No campaigns currently live.
            </p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {data.active_campaigns.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/campaigns/${c.id}`}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-2.5 hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <Link
                        href={`/managed-brands/${c.managed_brand_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        {c.managed_brand_name}
                      </Link>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {c.contacted} contacted
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {c.confirmed} confirmed
                    </span>
                    <Badge variant={c.paid > 0 ? "success" : "outline"} className="text-[10px]">
                      {c.paid} paid
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Leaderboard ({data.period.replace("_", " ")})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.leaderboard.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground text-center">
                No team activity in this period.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="text-left font-medium px-4 py-2">Person</th>
                    <th className="text-right font-medium px-4 py-2" title="Talent outreaches">
                      T-O
                    </th>
                    <th className="text-right font-medium px-4 py-2" title="Talent activities">
                      T-A
                    </th>
                    <th className="text-right font-medium px-4 py-2" title="Campaign outreaches">
                      C-O
                    </th>
                    <th className="text-right font-medium px-4 py-2" title="Campaign activities">
                      C-A
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-2">{u.full_name}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {u.talent_outreaches}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {u.talent_activities}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {u.campaign_outreaches}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {u.campaign_activities}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Per-talent activity (last 7d)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.per_talent.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground text-center">
                No talent-level activity recorded.
              </p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.per_talent.slice(0, 12).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2">
                    <Link
                      href={`/talents/${t.id}`}
                      className="font-medium hover:text-primary truncate flex-1"
                    >
                      {t.name}
                    </Link>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {t.brands_pitched} brand{t.brands_pitched === 1 ? "" : "s"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtRelative(t.last_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DeltaCard({
  icon,
  label,
  value,
  delta,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  delta: number;
  hint?: string;
}) {
  const positive = delta > 0;
  const negative = delta < 0;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
          {label}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          {delta !== 0 ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs",
                positive && "text-success",
                negative && "text-destructive",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(delta)}
            </span>
          ) : null}
        </div>
        {hint ? (
          <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
            {hint}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
