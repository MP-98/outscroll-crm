import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { StatusPill } from "@/components/status-pill";
import { ManagedBrandForm } from "@/components/forms/managed-brand-form";
import { ManagedBrandNotes } from "./notes";
import { igUrl, normalizeIgHandle } from "@/lib/ig";
import { formatINR } from "@/lib/currency";
import { fmtDate, fmtRelative } from "@/lib/date";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManagedBrandDetailPage({ params }: Props) {
  const { id } = await params;
  await requireProfile();
  const supabase = await createClient();

  const [{ data: brand }, { data: campaigns }] = await Promise.all([
    supabase.from("managed_brands").select("*").eq("id", id).single(),
    supabase
      .from("campaigns")
      .select("id, name, status, starts_on, ends_on, budget, updated_at")
      .eq("managed_brand_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!brand) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Managed brands", href: "/managed-brands" },
          { label: brand.name },
        ]}
      />
      <div className="border-b border-border px-5 py-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-base font-semibold">{brand.name}</h1>
          {brand.industry ? <Badge variant="outline">{brand.industry}</Badge> : null}
          <StatusPill status={brand.status} />
          {brand.ig_handle ? (
            <a
              href={igUrl(brand.ig_handle)}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              @{normalizeIgHandle(brand.ig_handle)}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {brand.website ? (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              {brand.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          <span className="ml-auto text-xs text-muted-foreground">
            {brand.monthly_retainer
              ? `${formatINR(brand.monthly_retainer)}/mo retainer`
              : "No retainer set"}
          </span>
        </div>
      </div>

      <div className="px-5 py-4">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">
              Campaigns ({campaigns?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-3xl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Primary contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {brand.primary_contact_name ? (
                    <div className="font-medium">{brand.primary_contact_name}</div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No contact set.</p>
                  )}
                  {brand.primary_contact_email ? (
                    <a
                      href={`mailto:${brand.primary_contact_email}`}
                      className="text-xs hover:text-primary block"
                    >
                      {brand.primary_contact_email}
                    </a>
                  ) : null}
                  {brand.primary_contact_phone ? (
                    <div className="text-xs">{brand.primary_contact_phone}</div>
                  ) : null}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Account meta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <Row label="Onboarded" value={brand.onboarded_at ? fmtDate(brand.onboarded_at) : "—"} />
                  <Row label="Retainer" value={formatINR(brand.monthly_retainer)} />
                  <Row label="Created" value={fmtRelative(brand.created_at)} />
                  <Row label="Updated" value={fmtRelative(brand.updated_at)} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            <div className="space-y-3 max-w-3xl">
              <div className="flex justify-end">
                <Button asChild size="sm">
                  <Link href={`/campaigns/new?managed_brand_id=${brand.id}`}>
                    <Plus />
                    New campaign
                  </Link>
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  {campaigns && campaigns.length > 0 ? (
                    <ul className="divide-y divide-border text-sm">
                      {campaigns.map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/campaigns/${c.id}`}
                            className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
                          >
                            <span className="font-medium truncate">{c.name}</span>
                            <StatusPill status={c.status} />
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatINR(c.budget)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {c.starts_on ? fmtDate(c.starts_on) : "—"}
                              {c.ends_on ? ` → ${fmtDate(c.ends_on)}` : ""}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {fmtRelative(c.updated_at)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-8 text-xs text-muted-foreground text-center">
                      No campaigns yet for this brand.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="max-w-2xl">
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

          <TabsContent value="notes">
            <ManagedBrandNotes brandId={brand.id} notes={brand.notes} />
          </TabsContent>

          <TabsContent value="edit">
            <ManagedBrandForm
              brandId={brand.id}
              initial={{
                name: brand.name,
                industry: brand.industry,
                ig_handle: brand.ig_handle,
                website: brand.website,
                monthly_retainer: brand.monthly_retainer,
                status: brand.status,
                primary_contact_name: brand.primary_contact_name,
                primary_contact_email: brand.primary_contact_email,
                primary_contact_phone: brand.primary_contact_phone,
                notes: brand.notes,
                onboarded_at: brand.onboarded_at,
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
