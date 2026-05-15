import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { StatusPill } from "@/components/status-pill";
import { CampaignForm } from "@/components/forms/campaign-form";
import { BriefCard } from "./brief-card";
import { AddInfluencersDialog } from "./add-influencers-dialog";
import {
  InfluencerOutreachView,
  type CampaignOutreachRow,
} from "./influencer-outreach-view";
import { DeliverablesTracker, type DeliverableRow } from "./deliverables-tracker";
import { formatINR } from "@/lib/currency";
import { fmtDate, fmtRelative } from "@/lib/date";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const me = await requireProfile();
  const supabase = await createClient();

  const [
    { data: campaign },
    { data: managedBrands },
    { data: managers },
    { data: outreaches },
    { data: pool },
    { data: talents },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select(
        `*,
         managed_brand:managed_brands(id, name, industry),
         owner:profiles!campaigns_owner_id_fkey(id, full_name)`,
      )
      .eq("id", id)
      .single(),
    supabase
      .from("managed_brands")
      .select("id, name")
      .neq("status", "churned")
      .order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase
      .from("campaign_outreaches")
      .select(
        `id, status, payment_status, agreed_amount, proposed_amount,
         next_followup_at, updated_at, created_at, deliverables, deliverable_done,
         external_influencer_id, talent_id,
         external_influencer:external_influencers(id, full_name, ig_handle),
         talent:talents(id, full_name, ig_handle)`,
      )
      .eq("campaign_id", id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("external_influencers")
      .select(
        "id, full_name, ig_handle, ig_followers, avg_reel_views, niches, city, rate_reel",
      )
      .order("full_name"),
    supabase
      .from("talents")
      .select(
        "id, full_name, ig_handle, ig_followers, avg_reel_views, niches, city, rate_reel",
      )
      .neq("status", "offboarded")
      .order("full_name"),
  ]);

  if (!campaign) notFound();
  const c = campaign as typeof campaign & {
    managed_brand: { id: string; name: string; industry: string | null } | null;
    owner: { id: string; full_name: string | null } | null;
  };

  const cos = outreaches ?? [];
  const total = cos.length;
  const confirmed = cos.filter((o) =>
    ["confirmed", "live", "paid"].includes(o.status),
  ).length;
  const live = cos.filter((o) => o.status === "live").length;
  const paid = cos.filter((o) => o.payment_status === "paid").length;

  // Shape the joined rows for the views below.
  type JoinedRow = {
    id: string;
    status: string;
    payment_status: string;
    agreed_amount: number | null;
    proposed_amount: number | null;
    next_followup_at: string;
    updated_at: string;
    created_at: string;
    deliverables: string | null;
    deliverable_done: boolean;
    external_influencer_id: string | null;
    talent_id: string | null;
    external_influencer?:
      | { id: string; full_name: string | null; ig_handle: string }
      | Array<{ id: string; full_name: string | null; ig_handle: string }>
      | null;
    talent?:
      | { id: string; full_name: string; ig_handle: string }
      | Array<{ id: string; full_name: string; ig_handle: string }>
      | null;
  };

  function whoOf(row: JoinedRow): {
    name: string;
    handle: string;
    kind: "external" | "talent";
  } {
    const ext = Array.isArray(row.external_influencer)
      ? row.external_influencer[0]
      : row.external_influencer;
    const tal = Array.isArray(row.talent) ? row.talent[0] : row.talent;
    if (tal) {
      return { name: tal.full_name, handle: tal.ig_handle, kind: "talent" };
    }
    if (ext) {
      return {
        name: ext.full_name ?? `@${ext.ig_handle}`,
        handle: ext.ig_handle,
        kind: "external",
      };
    }
    return { name: "—", handle: "—", kind: "external" };
  }

  const viewRows: CampaignOutreachRow[] = (cos as JoinedRow[]).map((r) => {
    const who = whoOf(r);
    return {
      id: r.id,
      who_name: who.name,
      who_handle: who.handle,
      who_kind: who.kind,
      status: r.status as CampaignOutreachRow["status"],
      payment_status: r.payment_status as CampaignOutreachRow["payment_status"],
      agreed_amount: r.agreed_amount,
      proposed_amount: r.proposed_amount,
      next_followup_at: r.next_followup_at,
      updated_at: r.updated_at,
      created_at: r.created_at,
    };
  });

  const deliverableRows: DeliverableRow[] = (cos as JoinedRow[]).map((r) => {
    const who = whoOf(r);
    return {
      id: r.id,
      who_name: who.name,
      who_handle: who.handle,
      who_kind: who.kind,
      status: r.status as DeliverableRow["status"],
      payment_status: r.payment_status as DeliverableRow["payment_status"],
      deliverables: r.deliverables,
      deliverable_done: r.deliverable_done,
    };
  });

  const alreadyAdded = {
    external: new Set(
      (cos as JoinedRow[])
        .map((r) => r.external_influencer_id)
        .filter(Boolean) as string[],
    ),
    talent: new Set(
      (cos as JoinedRow[]).map((r) => r.talent_id).filter(Boolean) as string[],
    ),
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Campaigns", href: "/campaigns" },
          { label: c.name },
        ]}
      />
      <div className="border-b border-border px-5 py-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-base font-semibold">{c.name}</h1>
          {c.managed_brand ? (
            <Link
              href={`/managed-brands/${c.managed_brand.id}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {c.managed_brand.name}
            </Link>
          ) : null}
          <StatusPill status={c.status} />
          {c.managed_brand?.industry ? (
            <Badge variant="outline">{c.managed_brand.industry}</Badge>
          ) : null}
          <span className="ml-auto text-xs text-muted-foreground">
            Owner: {c.owner?.full_name ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Budget: {formatINR(c.budget)}</span>
          {c.starts_on ? <span>From {fmtDate(c.starts_on)}</span> : null}
          {c.ends_on ? <span>To {fmtDate(c.ends_on)}</span> : null}
          <span className="ml-auto">Updated {fmtRelative(c.updated_at)}</span>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-4 gap-2 max-w-2xl mb-4">
          <Stat label="Total reach-outs" value={String(total)} />
          <Stat label="Confirmed+" value={String(confirmed)} />
          <Stat label="Live" value={String(live)} />
          <Stat label="Paid" value={String(paid)} />
        </div>

        <Tabs defaultValue="brief">
          <TabsList>
            <TabsTrigger value="brief">Brief</TabsTrigger>
            <TabsTrigger value="influencers">
              Influencer outreach ({total})
            </TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="brief">
            <BriefCard
              campaignId={c.id}
              brief={c.brief}
              deliverableTarget={c.deliverable_target}
              notes={c.notes}
            />
          </TabsContent>

          <TabsContent value="influencers">
            <div className="space-y-3">
              <div className="flex items-center justify-end">
                <AddInfluencersDialog
                  campaignId={c.id}
                  influencers={(pool ?? []).map((p) => ({
                    id: p.id,
                    full_name: p.full_name,
                    ig_handle: p.ig_handle,
                    ig_followers: p.ig_followers,
                    avg_reel_views: p.avg_reel_views,
                    niches: p.niches ?? [],
                    city: p.city,
                    rate_reel: p.rate_reel,
                  }))}
                  talents={(talents ?? []).map((t) => ({
                    id: t.id,
                    full_name: t.full_name,
                    ig_handle: t.ig_handle,
                    ig_followers: t.ig_followers,
                    avg_reel_views: t.avg_reel_views,
                    niches: t.niches ?? [],
                    city: t.city,
                    rate_reel: t.rate_reel,
                  }))}
                  alreadyAdded={alreadyAdded}
                />
              </div>
              <InfluencerOutreachView rows={viewRows} />
            </div>
          </TabsContent>

          <TabsContent value="deliverables">
            <DeliverablesTracker rows={deliverableRows} />
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Upload UI ships in Phase 3 polish. Storage bucket is provisioned.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit">
            <CampaignForm
              campaignId={c.id}
              managedBrands={(managedBrands ?? []).map((b) => ({
                id: b.id,
                label: b.name,
              }))}
              managers={(managers ?? []).map((m) => ({
                id: m.id,
                label: m.full_name ?? "—",
              }))}
              currentUserId={me.id}
              initial={{
                managed_brand_id: c.managed_brand_id,
                name: c.name,
                brief: c.brief,
                budget: c.budget,
                deliverable_target: c.deliverable_target,
                starts_on: c.starts_on,
                ends_on: c.ends_on,
                status: c.status,
                owner_id: c.owner_id,
                notes: c.notes,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-semibold mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}

export const dynamic = "force-dynamic";
