import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ChannelIcon } from "@/components/channel-icon";
import { fmtRelative, fmtDateTime } from "@/lib/date";
import { StatusSelect } from "./status-select";
import { ChannelSelect, OwnerSelect } from "./header-controls";
import { ActivityComposer } from "./activity-composer";
import { BrandPanel } from "./brand-panel";
import { DealTermsCard } from "./deal-terms-card";
import { NotesCard } from "./notes-card";
import type { Outreach, Talent, Brand, Profile } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OutreachDetailPage({ params }: Props) {
  const { id } = await params;
  await requireProfile();
  const supabase = await createClient();

  const [{ data: outreach }, { data: activities }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("outreaches")
        .select(
          `*,
           talent:talents(id, full_name, ig_handle, default_commission_pct),
           brand:brands(id, name, ig_handle, industry, website),
           owner:profiles!outreaches_owner_id_fkey(id, full_name)`,
        )
        .eq("id", id)
        .single(),
      supabase
        .from("outreach_activities")
        .select(`*, author:profiles!outreach_activities_author_id_fkey(id, full_name)`)
        .eq("outreach_id", id)
        .order("occurred_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").order("full_name"),
    ]);

  if (!outreach) notFound();

  type Joined = Outreach & {
    talent: Pick<Talent, "id" | "full_name" | "ig_handle" | "default_commission_pct"> | null;
    brand: Pick<Brand, "id" | "name" | "ig_handle" | "industry" | "website"> | null;
    owner: Pick<Profile, "id" | "full_name"> | null;
  };
  const o = outreach as Joined;

  // Brand hub data: all POCs for this brand + other outreaches with the brand.
  const [{ data: brandPocs }, { data: brandOutreaches }] = await Promise.all([
    supabase
      .from("brand_pocs")
      .select("id, brand_id, full_name, role_title, email, phone, ig_handle, linkedin_url")
      .eq("brand_id", o.brand_id),
    supabase
      .from("outreaches")
      .select("id, status, updated_at, talent:talents(id, full_name)")
      .eq("brand_id", o.brand_id)
      .neq("id", o.id)
      .order("updated_at", { ascending: false }),
  ]);

  const members = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.full_name ?? "—",
  }));

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
          <div className="ml-auto flex items-center gap-1">
            <ChannelSelect outreachId={o.id} channel={o.channel} />
            <OwnerSelect outreachId={o.id} ownerId={o.owner_id} members={members} />
          </div>
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
                    const auth =
                      (a as { author?: { full_name?: string } }).author?.full_name ?? "—";
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
          <DealTermsCard
            outreachId={o.id}
            defaultCommissionPct={o.talent?.default_commission_pct ?? null}
            terms={{
              deliverables: o.deliverables,
              proposed_amount: o.proposed_amount,
              negotiated_amount: o.negotiated_amount,
              agreed_amount: o.agreed_amount,
              commission_pct: o.commission_pct,
              direction: o.direction,
              reached_out_at: o.reached_out_at,
              next_followup_at: o.next_followup_at,
              paid_at: o.paid_at,
              lost_reason: o.lost_reason,
            }}
          />

          <BrandPanel
            outreachId={o.id}
            brand={o.brand}
            pocs={(brandPocs ?? []) as unknown as Parameters<typeof BrandPanel>[0]["pocs"]}
            primaryPocId={o.primary_poc_id}
            otherOutreaches={
              (brandOutreaches ?? []).map((bo) => {
                const t = bo as { talent?: unknown };
                const talent = Array.isArray(t.talent) ? t.talent[0] : t.talent;
                return { ...bo, talent: talent ?? null };
              }) as Parameters<typeof BrandPanel>[0]["otherOutreaches"]
            }
          />

          <NotesCard outreachId={o.id} notes={o.notes} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Created
                </span>
                <span className="text-sm text-right">{fmtRelative(o.created_at)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Updated
                </span>
                <span className="text-sm text-right">{fmtRelative(o.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";
