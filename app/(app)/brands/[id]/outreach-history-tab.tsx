import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelIcon } from "@/components/channel-icon";
import { StatusPill } from "@/components/status-pill";
import { formatINR } from "@/lib/currency";
import { fmtRelative } from "@/lib/date";
import type { Outreach, OutreachActivity } from "@/lib/supabase/types";

type Row = Outreach & {
  talent: { id: string; full_name: string; ig_handle: string } | null;
  activities?: Array<Pick<OutreachActivity, "occurred_at">>;
};

export function OutreachHistoryTab({ outreaches }: { outreaches: Row[] }) {
  if (outreaches.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-xs text-muted-foreground">
          No outreaches with this brand yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-border text-sm">
          {outreaches.map((o) => {
            const lastAct =
              o.activities && o.activities.length > 0
                ? o.activities.map((a) => a.occurred_at).sort().reverse()[0]
                : o.updated_at;
            return (
              <li key={o.id}>
                <Link
                  href={`/outreaches/${o.id}`}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
                >
                  <ChannelIcon channel={o.channel} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{o.talent?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">@{o.talent?.ig_handle}</div>
                  </div>
                  <StatusPill status={o.status} />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatINR(o.agreed_amount ?? o.proposed_amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">{fmtRelative(lastAct)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
