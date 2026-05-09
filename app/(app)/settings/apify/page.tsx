import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtDateTime } from "@/lib/date";
import type { IgSyncRun } from "@/lib/supabase/types";

export const metadata = { title: "Apify · Settings" };

export default async function ApifySettingsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("ig_sync_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const tokenSet = !!process.env.APIFY_TOKEN;

  // Sum monthly cost (current month).
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: monthRuns } = await supabase
    .from("ig_sync_runs")
    .select("cost_credits")
    .gte("created_at", monthStart.toISOString());
  const monthlyCredits = (monthRuns ?? []).reduce(
    (s, r) => s + Number(r.cost_credits ?? 0),
    0,
  );
  const successCount = (runs ?? []).filter((r) => r.status === "succeeded").length;

  return (
    <section className="max-w-2xl space-y-6">
      <header>
        <h2 className="text-base font-semibold">Apify integration</h2>
        <p className="text-xs text-muted-foreground">
          We use the <code className="bg-muted px-1 py-0.5 rounded">apify/instagram-scraper</code>
          {" "}actor to sync follower count and average reel views per record. Per-request only —
          never bulk-auto.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Token</CardTitle>
          <CardDescription>
            Configure via the <code className="bg-muted px-1 rounded">APIFY_TOKEN</code> env var.
            Rotate by re-deploying with a new value.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">Token status</span>
            {tokenSet ? (
              <Badge variant="success">Configured</Badge>
            ) : (
              <Badge variant="warning">Missing</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spend (current month)</CardTitle>
          <CardDescription>
            Sum of {`ig_sync_runs.cost_credits`}. Apify reports cost asynchronously, so values may
            lag slightly behind your Apify console.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Successful syncs (last 20)</div>
            <div className="text-base font-semibold mt-0.5">{successCount}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Credits used (this month)</div>
            <div className="text-base font-semibold mt-0.5">
              {monthlyCredits > 0 ? monthlyCredits.toFixed(2) : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent syncs</CardTitle>
        </CardHeader>
        <CardContent>
          {runs && runs.length > 0 ? (
            <div className="divide-y divide-border text-sm -mx-2">
              {(runs as IgSyncRun[]).map((r) => (
                <div key={r.id} className="px-2 py-2 flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground w-32 truncate">
                    @{r.ig_handle}
                  </span>
                  <span className="text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</span>
                  <span className="ml-auto">
                    {r.status === "succeeded" ? (
                      <Badge variant="success">success</Badge>
                    ) : r.status === "failed" ? (
                      <Badge variant="destructive">failed</Badge>
                    ) : (
                      <Badge>{r.status}</Badge>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No syncs yet.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
