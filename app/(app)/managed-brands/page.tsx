import Link from "next/link";
import { Plus, ExternalLink, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { formatINR } from "@/lib/currency";
import { fmtDate } from "@/lib/date";
import { igUrl, normalizeIgHandle } from "@/lib/ig";

export const metadata = { title: "Managed brands" };

export default async function ManagedBrandsPage() {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("managed_brands")
    .select(`*, campaigns(id, status)`)
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((b) => {
    const cs = (b as { campaigns?: Array<{ status: string }> }).campaigns ?? [];
    return {
      ...b,
      campaign_count: cs.length,
      live_count: cs.filter((c) => c.status === "live").length,
    };
  });

  return (
    <>
      <PageHeader
        title="Managed brands"
        subtitle={`${rows.length} brand${rows.length === 1 ? "" : "s"} on retainer`}
      >
        <Button asChild>
          <Link href="/managed-brands/new">
            <Plus />
            New managed brand
          </Link>
        </Button>
      </PageHeader>

      {rows.length === 0 ? (
        <div className="px-5 py-8">
          <EmptyState
            icon={<Briefcase />}
            title="No managed brands yet"
            description="Add a brand whose Instagram you manage to start running campaigns."
            action={
              <Button asChild size="sm">
                <Link href="/managed-brands/new">
                  <Plus />
                  New managed brand
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="px-5 py-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="text-left font-medium px-3 py-2">Brand</th>
                  <th className="text-left font-medium px-3 py-2">Industry</th>
                  <th className="text-left font-medium px-3 py-2">IG</th>
                  <th className="text-left font-medium px-3 py-2">Retainer</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                  <th className="text-right font-medium px-3 py-2">Campaigns</th>
                  <th className="text-left font-medium px-3 py-2">Onboarded</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-border last:border-b-0 hover:bg-accent cursor-pointer"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/managed-brands/${b.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {b.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {b.industry ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {b.ig_handle ? (
                        <a
                          href={igUrl(b.ig_handle)}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
                        >
                          @{normalizeIgHandle(b.ig_handle)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatINR(b.monthly_retainer)}
                      <span className="text-xs text-muted-foreground ml-1">
                        /mo
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className="text-foreground">{b.campaign_count}</span>
                      {b.live_count > 0 ? (
                        <Badge variant="primary" className="ml-1.5 text-[10px]">
                          {b.live_count} live
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {b.onboarded_at ? fmtDate(b.onboarded_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
