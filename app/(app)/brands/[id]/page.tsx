import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PocsTab } from "./pocs-tab";
import { OutreachHistoryTab } from "./outreach-history-tab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BrandDetailPage({ params }: Props) {
  const { id } = await params;
  await requireProfile();
  const supabase = await createClient();

  const [{ data: brand }, { data: pocs }, { data: outreaches }] = await Promise.all([
    supabase.from("brands").select("*").eq("id", id).single(),
    supabase.from("brand_pocs").select("*").eq("brand_id", id),
    supabase
      .from("outreaches")
      .select(
        `*,
         talent:talents(id, full_name, ig_handle),
         activities:outreach_activities(occurred_at)`,
      )
      .eq("brand_id", id)
      .order("updated_at", { ascending: false }),
  ]);

  if (!brand) notFound();

  return (
    <>
      <div className="border-b border-border px-5 py-4 flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-base font-semibold">{brand.name}</h1>
          {brand.ig_handle ? (
            <a
              href={`https://instagram.com/${brand.ig_handle}`}
              target="_blank"
              rel="noopener"
              className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              @{brand.ig_handle}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {brand.website ? (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener"
              className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              {brand.website.replace(/^https?:\/\//, "")}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {brand.industry ? <Badge variant="outline">{brand.industry}</Badge> : null}
        </div>
        <div className="flex flex-wrap gap-1">
          {(brand.tags ?? []).map((t: string) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        <Tabs defaultValue="pocs">
          <TabsList>
            <TabsTrigger value="pocs">POCs ({pocs?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="history">Outreach history ({outreaches?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="pocs">
            <PocsTab brandId={brand.id} initial={pocs ?? []} />
          </TabsContent>
          <TabsContent value="history">
            <OutreachHistoryTab outreaches={outreaches ?? []} />
          </TabsContent>
          <TabsContent value="documents">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-sm">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Upload UI ships in Phase 3 polish. Storage bucket already provisioned.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="edit">
            <BrandEditForm brand={brand} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

import { BrandForm } from "@/components/forms/brand-form";
import type { Brand } from "@/lib/supabase/types";

function BrandEditForm({ brand }: { brand: Brand }) {
  return (
    <div className="max-w-xl">
      <BrandForm
        brandId={brand.id}
        initial={{
          name: brand.name,
          industry: brand.industry,
          ig_handle: brand.ig_handle,
          website: brand.website,
          tags: brand.tags ?? [],
        }}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
