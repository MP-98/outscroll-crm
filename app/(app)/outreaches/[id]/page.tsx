import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ChannelIcon, ChannelLabel } from "@/components/channel-icon";
import { fmtDate, fmtRelative, fmtDateTime } from "@/lib/date";
import { formatINR, commission } from "@/lib/currency";
import { StatusSelect } from "./status-select";
import { ActivityComposer } from "./activity-composer";
import type { Outreach, Talent, Brand, BrandPoc, Profile } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OutreachDetailPage({ params }: Props) {
  const { id } = await params;
  await requireProfile();
  const supabase = await createClient();

  const [{ data: outreach }, { data: activities }] = await Promise.all([
    supabase
      .from("outreaches")
      .select(
        `*,
         talent:talents(id, full_name, ig_handle, default_commission_pct),
         brand:brands(id, name, ig_handle),
         poc:brand_pocs!outreaches_primary_poc_id_fkey(id, full_name, role_title, email, phone),
         owner:profiles!outreaches_owner_id_fkey(id, full_name)`,
      )
      .eq("id", id)
      .single(),
    supabase
      .from("outreach_activities")
      .select(`*, author:profiles!outreach_activities_author_id_fkey(id, full_name)`)
      .eq("outreach_id", id)
      .order("occurred_at", { ascending: false }),
  ]);

  if (!outreach) notFound();

  type Joined = Outreach & {
    talent: Pick<Talent, "id" | "full_name" | "ig_handle" | "default_commission_pct"> | null;
    brand: Pick<Brand, "id" | "name" | "ig_handle"> | null;
    poc: Pick<BrandPoc, "id" | "full_name" | "role_title" | "email" | "phone"> | null;
    owner: Pick<Profile, "id" | "full_name"> | null;
  };
  const o = outreach as Joined;

  const commissionPct = o.commission_pct ?? o.talent?.default_commission_pct ?? 20;
  const commissionAmt = commission(o.agreed_amount ?? null, commissionPct ?? 20);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Outreaches", href: "/outreaches" },
          {
            label:
              (o.talent?.full_name ?? "Talent") + " ↔ " + (o.brand?.name ?? "Brand"),
          },
        ]}
      />
      <div className="border-b border-border px-5 py-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/talents/${o.talent_id}`}
            className="text-sm font-semibold hover:text-primary"
          >
            {o.talent?.full_name ?? "Talent"}
          </Link>
          <span className="text-muted-foreground">↔</span>
          <Link
            href={`/brands/${o.brand_id}`}
            className="text-sm font-semibold hover:text-primary"
          >
            {o.brand?.name ?? "Brand"}
          </Link>
          <StatusSelect id={o.id} status={o.status} />
          <span className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <ChannelIcon channel={o.channel} />
            {ChannelLabel(o.channel)}
          </span>
          <span className="text-xs text-muted-foreground">
            Owner: {o.owner?.full_name ?? "—"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {(o.tags ?? []).map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 px-5 py-5">
        <div className="space-y-4 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActivityComposer outreachId={o.id} />
              {(activities ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No activity yet. Log the first one above.
                </p>
              ) : (
                <ol className="space-y-3 border-l border-border pl-5 ml-1">
                  {(activities ?? []).map((a) => {
                    const auth = (a as { author?: { full_name?: string } }).author?.full_name ?? "—";
                    return (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-[27px] top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border">
                          <ChannelIcon channel={a.channel} />
                        </span>
                        <div className="text-sm leading-snug">
                          <span className="font-medium">{auth}</span>
                          {a.direction ? (
                            <span className="text-xs text-muted-foreground ml-1.5 capitalize">
                              {a.direction}
                            </span>
                          ) : null}
                          <span className="text-xs text-muted-foreground ml-1.5">
                            · {fmtDateTime(a.occurred_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{a.summary}</p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Deal terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Detail label="Deliverables" value={o.deliverables ?? "—"} multiline />
              <Detail label="Proposed" value={formatINR(o.proposed_amount)} />
              <Detail label="Agreed" value={formatINR(o.agreed_amount)} />
              <Detail label="Commission %" value={commissionPct ? `${commissionPct}%` : "—"} />
              <Detail label="Commission ₹" value={formatINR(commissionAmt)} />
              <Detail
                label="Next follow-up"
                value={fmtDate(o.next_followup_at)}
              />
              {o.paid_at ? <Detail label="Paid" value={fmtDate(o.paid_at)} /> : null}
              {o.lost_reason ? <Detail label="Lost reason" value={o.lost_reason} /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">POC at brand</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {o.poc ? (
                <div className="space-y-1">
                  <div className="font-medium">{o.poc.full_name}</div>
                  {o.poc.role_title ? (
                    <div className="text-xs text-muted-foreground">{o.poc.role_title}</div>
                  ) : null}
                  {o.poc.email ? (
                    <a href={`mailto:${o.poc.email}`} className="text-xs hover:text-primary block">
                      {o.poc.email}
                    </a>
                  ) : null}
                  {o.poc.phone ? (
                    <div className="text-xs">{o.poc.phone}</div>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No POC linked.</p>
              )}
            </CardContent>
          </Card>

          {o.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{o.notes}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Detail label="Created" value={fmtRelative(o.created_at)} />
              <Detail label="Updated" value={fmtRelative(o.updated_at)} />
              {o.brand?.ig_handle ? (
                <a
                  href={`https://instagram.com/${o.brand.ig_handle}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  Brand IG
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Detail({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "space-y-0.5" : "flex justify-between gap-3"}>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={multiline ? "text-sm" : "text-sm text-right"}>{value}</span>
    </div>
  );
}

export const dynamic = "force-dynamic";
