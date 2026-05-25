import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, MapPin, RefreshCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { StatusPill } from "@/components/status-pill";
import { InfluencerForm } from "@/components/forms/influencer-form";
import { SyncIgButton } from "./sync-button";
import { formatCompact, formatINR } from "@/lib/currency";
import { fmtRelative, fmtDate } from "@/lib/date";
import { igUrl, normalizeIgHandle } from "@/lib/ig";
import { initials } from "@/lib/utils";

const FORMAT_MIX_LABEL: Record<string, string> = {
  reel_heavy: "Reel-heavy",
  photo_heavy: "Photo-heavy",
  mixed: "Mixed",
};
const PRODUCTION_LABEL: Record<string, string> = {
  high: "High (DSLR/agency)",
  mid: "Mid (good phone)",
  low: "Low (raw phone)",
};
const ANALYSIS_LABEL: Record<string, string> = {
  not_analyzed: "Not analyzed",
  tier_1: "Tier 1",
  tier_2: "Tier 2",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InfluencerDetailPage({ params }: Props) {
  const { id } = await params;
  await requireProfile();
  const supabase = await createClient();

  const [
    { data: influencer },
    { data: outreaches },
    { data: niches },
    { data: tagRows },
  ] = await Promise.all([
    supabase.from("external_influencers").select("*").eq("id", id).single(),
    supabase
      .from("campaign_outreaches")
      .select(
        `id, status, updated_at, payment_status, agreed_amount,
         campaign:campaigns(id, name, managed_brand:managed_brands(id, name))`,
      )
      .eq("external_influencer_id", id)
      .order("updated_at", { ascending: false }),
    supabase.from("niches").select("name").order("name"),
    supabase.from("external_influencers").select("tags").not("tags", "is", null),
  ]);

  if (!influencer) notFound();

  const tagSeen = new Map<string, string>();
  for (const row of tagRows ?? []) {
    for (const t of (row.tags as string[] | null) ?? []) {
      const key = t.toLowerCase();
      if (!tagSeen.has(key)) tagSeen.set(key, t);
    }
  }
  const existingTags = Array.from(tagSeen.values()).sort();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Influencers", href: "/influencers" },
          { label: influencer.full_name ?? `@${influencer.ig_handle}` },
        ]}
      />
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-sm">
              {initials(influencer.full_name ?? influencer.ig_handle)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-semibold truncate">
                {influencer.full_name ?? `@${influencer.ig_handle}`}
              </h1>
              <a
                href={igUrl(influencer.ig_handle)}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                @{normalizeIgHandle(influencer.ig_handle)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <span className="font-medium text-foreground tabular-nums">
                  {formatCompact(influencer.ig_followers)}
                </span>
                followers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-medium text-foreground tabular-nums">
                  {formatCompact(influencer.avg_reel_views)}
                </span>
                avg reels
              </span>
              {influencer.ig_metrics_synced_at ? (
                <span className="inline-flex items-center gap-1">
                  <RefreshCcw className="h-3 w-3" />
                  synced {fmtRelative(influencer.ig_metrics_synced_at)}
                </span>
              ) : null}
              {influencer.city ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {influencer.city}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {(influencer.niches ?? []).map((n: string) => (
                <Badge key={n}>{n}</Badge>
              ))}
              {(influencer.tags ?? []).map((t: string) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <SyncIgButton influencerId={influencer.id} />
        </div>
      </div>

      <div className="px-5 py-4">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">
              Campaign history ({outreaches?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {influencer.contact_email ? (
                    <a
                      href={`mailto:${influencer.contact_email}`}
                      className="text-sm hover:text-primary block"
                    >
                      {influencer.contact_email}
                    </a>
                  ) : null}
                  {influencer.contact_phone ? (
                    <div>{influencer.contact_phone}</div>
                  ) : null}
                  {!influencer.contact_email && !influencer.contact_phone ? (
                    <p className="text-xs text-muted-foreground">
                      No contact on file.
                    </p>
                  ) : null}
                  {influencer.notes ? (
                    <p className="pt-2 text-xs text-foreground/80 whitespace-pre-wrap border-t border-border mt-2">
                      {influencer.notes}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Rate card</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <Row label="Reel (collab)" value={influencer.rate_reel ?? "—"} />
                  <Row
                    label="Reel (non-collab)"
                    value={influencer.rate_reel_non_collab ?? "—"}
                  />
                  <Row label="Story" value={influencer.rate_story ?? "—"} />
                  <Row label="Post" value={influencer.rate_post ?? "—"} />
                  <Row label="Ad rights" value={influencer.ad_rights ?? "—"} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Managed by someone?
                    </span>
                    <Badge
                      variant={
                        influencer.is_managed === true
                          ? "primary"
                          : influencer.is_managed === false
                            ? "outline"
                            : "default"
                      }
                    >
                      {influencer.is_managed === true
                        ? "Yes"
                        : influencer.is_managed === false
                          ? "No"
                          : "Unknown"}
                    </Badge>
                  </div>
                  {influencer.is_managed === true ? (
                    <Row label="Managed by" value={influencer.managed_by ?? "—"} />
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Content profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <Row label="POV" value={influencer.content_pov ?? "—"} />
                  <Row
                    label="Format mix"
                    value={FORMAT_MIX_LABEL[influencer.format_mix ?? ""] ?? "—"}
                  />
                  <Row
                    label="Production"
                    value={PRODUCTION_LABEL[influencer.production_quality ?? ""] ?? "—"}
                  />
                  <Row
                    label="Audience age"
                    value={influencer.audience_age_band_est ?? "—"}
                  />
                  <Row
                    label="Languages"
                    value={(influencer.languages ?? []).join(", ") || "—"}
                  />
                  <div className="flex justify-between gap-3">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Tone
                    </span>
                    <span className="flex flex-wrap gap-1 justify-end">
                      {(influencer.tone_tags ?? []).length > 0 ? (
                        (influencer.tone_tags ?? []).map((t: string) => (
                          <Badge key={t} variant="outline" className="text-[10px] capitalize">
                            {t}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm">—</span>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Depth
                    </span>
                    <Badge
                      variant={
                        influencer.analysis_depth === "tier_2"
                          ? "success"
                          : influencer.analysis_depth === "tier_1"
                            ? "primary"
                            : "outline"
                      }
                    >
                      {ANALYSIS_LABEL[influencer.analysis_depth ?? "not_analyzed"]}
                    </Badge>
                  </div>
                  <Row
                    label="Last analyzed"
                    value={
                      influencer.last_analyzed_at
                        ? fmtDate(influencer.last_analyzed_at)
                        : "—"
                    }
                  />
                  <Row label="Analyzed by" value={influencer.analyzed_by ?? "—"} />
                  <Row
                    label="Events"
                    value={influencer.events_other ?? "—"}
                  />
                </CardContent>
              </Card>

              {influencer.casting_notes ? (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm">Casting notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {influencer.casting_notes}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {influencer.brand_collabs_visible || influencer.red_flags ? (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm">Collabs & flags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {influencer.brand_collabs_visible ? (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Brand collabs visible
                        </div>
                        <p className="whitespace-pre-wrap">
                          {influencer.brand_collabs_visible}
                        </p>
                      </div>
                    ) : null}
                    {influencer.red_flags ? (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-destructive">
                          Red flags
                        </div>
                        <p className="whitespace-pre-wrap text-destructive/90">
                          {influencer.red_flags}
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-0">
                {outreaches && outreaches.length > 0 ? (
                  <ul className="divide-y divide-border text-sm">
                    {outreaches.map((o) => {
                      const raw = (o as { campaign?: unknown }).campaign;
                      const rawCamp = Array.isArray(raw) ? raw[0] : raw;
                      const camp = rawCamp as
                        | {
                            id: string;
                            name: string;
                            managed_brand?:
                              | { name?: string }
                              | Array<{ name?: string }>
                              | null;
                          }
                        | null
                        | undefined;
                      const mb = Array.isArray(camp?.managed_brand)
                        ? camp?.managed_brand[0]
                        : camp?.managed_brand;
                      return (
                        <li key={o.id}>
                          <Link
                            href={`/campaigns/${camp?.id ?? ""}`}
                            className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2.5 hover:bg-accent"
                          >
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {camp?.name ?? "Campaign"}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {mb?.name ?? "—"}
                              </div>
                            </div>
                            <StatusPill status={o.status} />
                            <Badge variant="outline" className="capitalize text-[10px]">
                              {o.payment_status}
                            </Badge>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatINR(o.agreed_amount)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {fmtRelative(o.updated_at)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="px-4 py-8 text-xs text-muted-foreground text-center">
                    Not on any campaign yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit">
            <InfluencerForm
              influencerId={influencer.id}
              niches={(niches ?? []).map((n) => n.name)}
              existingTags={existingTags}
              initial={{
                full_name: influencer.full_name,
                ig_handle: influencer.ig_handle,
                ig_followers: influencer.ig_followers,
                avg_reel_views: influencer.avg_reel_views,
                niches: influencer.niches ?? [],
                city: influencer.city,
                contact_email: influencer.contact_email,
                contact_phone: influencer.contact_phone,
                rate_reel: influencer.rate_reel,
                rate_story: influencer.rate_story,
                rate_post: influencer.rate_post,
                rate_reel_non_collab: influencer.rate_reel_non_collab,
                ad_rights: influencer.ad_rights,
                is_managed: influencer.is_managed,
                managed_by: influencer.managed_by,
                notes: influencer.notes,
                tags: influencer.tags ?? [],
                content_pov: influencer.content_pov,
                format_mix: influencer.format_mix,
                languages: influencer.languages ?? [],
                tone_tags: influencer.tone_tags ?? [],
                production_quality: influencer.production_quality,
                audience_age_band_est: influencer.audience_age_band_est,
                brand_collabs_visible: influencer.brand_collabs_visible,
                red_flags: influencer.red_flags,
                casting_notes: influencer.casting_notes,
                events_other: influencer.events_other,
                analysis_depth: influencer.analysis_depth ?? "not_analyzed",
                last_analyzed_at: influencer.last_analyzed_at,
                analyzed_by: influencer.analyzed_by,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export const dynamic = "force-dynamic";
