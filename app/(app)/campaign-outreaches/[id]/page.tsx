import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ChannelIcon } from "@/components/channel-icon";
import { fmtRelative, fmtDateTime } from "@/lib/date";
import { igUrl, normalizeIgHandle } from "@/lib/ig";
import { StatusSelect } from "./status-select";
import { ActivityComposer } from "./activity-composer";
import { TermsCard } from "./terms-card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignOutreachDetailPage({ params }: Props) {
  const { id } = await params;
  await requireProfile();
  const supabase = await createClient();

  const [{ data: row }, { data: activities }] = await Promise.all([
    supabase
      .from("campaign_outreaches")
      .select(
        `*,
         campaign:campaigns(id, name, managed_brand:managed_brands(id, name)),
         external_influencer:external_influencers(id, full_name, ig_handle, contact_email, contact_phone),
         talent:talents(id, full_name, ig_handle),
         owner:profiles!campaign_outreaches_owner_id_fkey(id, full_name)`,
      )
      .eq("id", id)
      .single(),
    supabase
      .from("campaign_outreach_activities")
      .select(`*, author:profiles!campaign_outreach_activities_author_id_fkey(id, full_name)`)
      .eq("campaign_outreach_id", id)
      .order("occurred_at", { ascending: false }),
  ]);

  if (!row) notFound();

  type Joined = typeof row & {
    campaign: {
      id: string;
      name: string;
      managed_brand:
        | { id: string; name: string }
        | Array<{ id: string; name: string }>
        | null;
    } | Array<{
      id: string;
      name: string;
      managed_brand:
        | { id: string; name: string }
        | Array<{ id: string; name: string }>
        | null;
    }> | null;
    external_influencer:
      | { id: string; full_name: string | null; ig_handle: string; contact_email: string | null; contact_phone: string | null }
      | Array<{ id: string; full_name: string | null; ig_handle: string; contact_email: string | null; contact_phone: string | null }>
      | null;
    talent:
      | { id: string; full_name: string; ig_handle: string }
      | Array<{ id: string; full_name: string; ig_handle: string }>
      | null;
    owner: { id: string; full_name: string | null } | null;
  };
  const r = row as Joined;

  const campaign = Array.isArray(r.campaign) ? r.campaign[0] : r.campaign;
  const mb = campaign
    ? Array.isArray(campaign.managed_brand)
      ? campaign.managed_brand[0]
      : campaign.managed_brand
    : null;
  const ext = Array.isArray(r.external_influencer)
    ? r.external_influencer[0]
    : r.external_influencer;
  const tal = Array.isArray(r.talent) ? r.talent[0] : r.talent;

  const whoName = tal?.full_name ?? ext?.full_name ?? `@${ext?.ig_handle ?? "—"}`;
  const whoHandle = tal?.ig_handle ?? ext?.ig_handle ?? "";
  const whoKind = tal ? "talent" : "external";

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Campaigns", href: "/campaigns" },
          campaign
            ? { label: campaign.name, href: `/campaigns/${campaign.id}` }
            : { label: "Campaign" },
          { label: whoName },
        ]}
      />
      <div className="border-b border-border px-5 py-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold">{whoName}</span>
          {whoHandle ? (
            <a
              href={igUrl(whoHandle)}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              @{normalizeIgHandle(whoHandle)}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {whoKind === "talent" ? (
            <Badge variant="primary">Talent</Badge>
          ) : (
            <Badge variant="outline">External</Badge>
          )}
          <span className="text-muted-foreground">·</span>
          {campaign ? (
            <Link
              href={`/campaigns/${campaign.id}`}
              className="text-sm font-medium hover:text-primary"
            >
              {campaign.name}
            </Link>
          ) : null}
          {mb ? (
            <Link
              href={`/managed-brands/${mb.id}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {mb.name}
            </Link>
          ) : null}
          <StatusSelect id={r.id} status={r.status} />
          <span className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1.5">
            {r.channel ? (
              <>
                <ChannelIcon channel={r.channel} />
                <span className="capitalize">{r.channel.replace("_", " ")}</span>
              </>
            ) : (
              <span>No channel</span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            Owner: {r.owner?.full_name ?? "—"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 px-5 py-5">
        <div className="space-y-4 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActivityComposer outreachId={r.id} />
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
          <TermsCard
            outreachId={r.id}
            terms={{
              deliverables: r.deliverables,
              proposed_amount: r.proposed_amount,
              agreed_amount: r.agreed_amount,
              next_followup_at: r.next_followup_at,
              payment_status: r.payment_status,
              paid_on: r.paid_on,
              deliverable_done: r.deliverable_done,
            }}
          />

          {ext && !tal ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {ext.contact_email ? (
                  <a
                    href={`mailto:${ext.contact_email}`}
                    className="block hover:text-primary text-xs"
                  >
                    {ext.contact_email}
                  </a>
                ) : null}
                {ext.contact_phone ? (
                  <div className="text-xs">{ext.contact_phone}</div>
                ) : null}
                {!ext.contact_email && !ext.contact_phone ? (
                  <p className="text-xs text-muted-foreground">
                    No contact on file. Update from the influencer page.
                  </p>
                ) : null}
                <Link
                  href={`/influencers/${ext.id}`}
                  className="block pt-2 text-xs text-primary hover:underline"
                >
                  Edit influencer →
                </Link>
              </CardContent>
            </Card>
          ) : null}

          {r.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{r.notes}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Created
                </span>
                <span className="text-sm text-right">{fmtRelative(r.created_at)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Updated
                </span>
                <span className="text-sm text-right">{fmtRelative(r.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";
