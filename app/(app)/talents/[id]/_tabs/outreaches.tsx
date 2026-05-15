import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChannelIcon } from "@/components/channel-icon";
import { StatusPill } from "@/components/status-pill";
import { formatINR } from "@/lib/currency";
import type { Outreach } from "@/lib/supabase/types";

const STAGES: Array<Outreach["status"]> = [
  "not_contacted",
  "prospected",
  "contacted",
  "in_conversation",
  "brief_received",
  "negotiating",
  "confirmed",
  "live",
  "paid",
  "on_hold",
  "lost",
];

export function OutreachesTab({
  outreaches,
}: {
  outreaches: Array<Outreach & { brand?: { id: string; name: string } | null }>;
}) {
  const grouped = STAGES.reduce<Record<string, typeof outreaches>>((acc, s) => {
    acc[s] = outreaches.filter((o) => o.status === s);
    return acc;
  }, {});
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild size="sm" variant="secondary">
          <Link href={`/outreaches/new?talent_id=${outreaches[0]?.talent_id ?? ""}`}>
            <Plus />
            Add outreach
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {STAGES.filter((s) => grouped[s].length > 0).map((stage) => (
          <Card key={stage}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm capitalize">
                <span>{stage.replace("_", " ")}</span>
                <span className="text-xs text-muted-foreground">{grouped[stage].length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {grouped[stage].map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/outreaches/${o.id}`}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors"
                    >
                      <ChannelIcon channel={o.channel} />
                      <span className="text-sm font-medium truncate flex-1">
                        {o.brand?.name ?? "Brand"}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatINR(o.agreed_amount ?? o.proposed_amount)}
                      </span>
                      <StatusPill status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      {outreaches.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No outreaches yet.</p>
      ) : null}
    </div>
  );
}
