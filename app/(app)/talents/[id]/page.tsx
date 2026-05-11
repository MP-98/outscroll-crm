import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Languages, RefreshCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/status-pill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { initials } from "@/lib/utils";
import { formatCompact, commission } from "@/lib/currency";
import { fmtDate, fmtRelative } from "@/lib/date";
import { igUrl, normalizeIgHandle } from "@/lib/ig";
import { OverviewTab } from "./_tabs/overview";
import { OutreachesTab } from "./_tabs/outreaches";
import { RateCardTab } from "./_tabs/rate-card";
import { ContactsTab } from "./_tabs/contacts";
import { DocumentsTab } from "./_tabs/documents";
import { RevenueTab } from "./_tabs/revenue";
import { SyncIgButton } from "./_tabs/sync-ig-button";
import { ManagerSelect } from "./_tabs/manager-select";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("talents").select("full_name").eq("id", id).single();
  return { title: data?.full_name ? `${data.full_name} · Talents` : "Talent" };
}

export default async function TalentDetailPage({ params }: Props) {
  const { id } = await params;
  const me = await requireProfile();
  const supabase = await createClient();

  const [
    { data: talent },
    { data: contacts },
    { data: outreaches },
    { data: documents },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("talents")
      .select(`*, manager:profiles!talents_manager_id_fkey(id, full_name, email)`)
      .eq("id", id)
      .single(),
    supabase.from("talent_contacts").select("*").eq("talent_id", id).order("is_primary", { ascending: false }),
    supabase
      .from("outreaches")
      .select("*, brand:brands(id, name, ig_handle)")
      .eq("talent_id", id)
      .order("updated_at", { ascending: false }),
    supabase.from("documents").select("*").eq("talent_id", id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  if (!talent) notFound();

  const lifetimeConfirmed = (outreaches ?? []).filter((o) =>
    ["confirmed", "live", "paid"].includes(o.status),
  );
  const lifetimePaid = (outreaches ?? []).filter((o) => o.status === "paid");
  const totalCommission = lifetimePaid.reduce(
    (s, o) => s + commission(o.agreed_amount ?? null, o.commission_pct ?? talent.default_commission_pct),
    0,
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Talents", href: "/talents" },
          { label: talent.full_name },
        ]}
      />
      <div className="border-b border-border">
        <div className="flex items-start gap-4 px-5 py-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-sm">{initials(talent.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-semibold truncate">{talent.full_name}</h1>
              <a
                href={igUrl(talent.ig_handle)}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                @{normalizeIgHandle(talent.ig_handle)}
                <ExternalLink className="h-3 w-3" />
              </a>
              <StatusPill status={talent.status} />
              <Badge variant="outline" className="capitalize">
                {talent.exclusivity.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <span className="font-medium text-foreground tabular-nums">
                  {formatCompact(talent.ig_followers)}
                </span>
                followers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-medium text-foreground tabular-nums">
                  {formatCompact(talent.avg_reel_views)}
                </span>
                avg reels
              </span>
              {talent.ig_metrics_synced_at ? (
                <span className="inline-flex items-center gap-1">
                  <RefreshCcw className="h-3 w-3" />
                  synced {fmtRelative(talent.ig_metrics_synced_at)}
                </span>
              ) : null}
              {talent.city ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {talent.city}
                </span>
              ) : null}
              {(talent.languages ?? []).length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Languages className="h-3 w-3" />
                  {(talent.languages ?? []).join(", ")}
                </span>
              ) : null}
              <ManagerSelect
                talentId={talent.id}
                currentManagerId={talent.manager_id}
                currentManagerName={
                  (talent as { manager?: { full_name?: string } }).manager?.full_name ?? null
                }
                managers={(profiles ?? []).map((p) => ({
                  id: p.id,
                  name: p.full_name ?? "—",
                }))}
                canReassign={me.role === "admin"}
              />
              {talent.onboarded_at ? (
                <span>Onboarded {fmtDate(talent.onboarded_at)}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {(talent.niches ?? []).map((n: string) => (
                <Badge key={n}>{n}</Badge>
              ))}
              {(talent.tags ?? []).map((t: string) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SyncIgButton talentId={talent.id} />
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="outreaches">
              Outreaches{outreaches ? ` (${outreaches.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="rate_card">Rate card</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab
              talent={talent}
              contacts={contacts ?? []}
              outreaches={outreaches ?? []}
            />
          </TabsContent>
          <TabsContent value="outreaches">
            <OutreachesTab outreaches={outreaches ?? []} />
          </TabsContent>
          <TabsContent value="rate_card">
            <RateCardTab
              talentId={talent.id}
              talent={talent}
              managers={(profiles ?? []).map((p) => ({ id: p.id, name: p.full_name ?? "—" }))}
            />
          </TabsContent>
          <TabsContent value="contacts">
            <ContactsTab talentId={talent.id} contacts={contacts ?? []} />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab talentId={talent.id} documents={documents ?? []} />
          </TabsContent>
          <TabsContent value="revenue">
            <RevenueTab
              total_confirmed={lifetimeConfirmed.length}
              total_paid={lifetimePaid.length}
              total_paid_amount={lifetimePaid.reduce((s, o) => s + (o.agreed_amount ?? 0), 0)}
              total_commission={totalCommission}
              recent_paid={lifetimePaid.slice(0, 8)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";
