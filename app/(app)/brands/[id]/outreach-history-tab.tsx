import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChannelIcon } from "@/components/channel-icon";
import { StatusPill } from "@/components/status-pill";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { formatINR } from "@/lib/currency";
import { fmtRelative } from "@/lib/date";
import type { Outreach, OutreachActivity } from "@/lib/supabase/types";

type Row = Outreach & {
  talent: { id: string; full_name: string; ig_handle: string } | null;
  activities?: Array<Pick<OutreachActivity, "occurred_at">>;
};

const ACTIVE_STATUSES = new Set([
  "prospected",
  "contacted",
  "in_conversation",
  "brief_received",
  "negotiating",
  "confirmed",
  "live",
]);

export function OutreachHistoryTab({ outreaches }: { outreaches: Row[] }) {
  // Group by talent to surface "influencers connected to this brand."
  const byTalent = new Map<
    string,
    {
      id: string;
      name: string;
      ig: string;
      total: number;
      active: number;
      confirmed: number;
      paid_amount: number;
      last_at: string | null;
    }
  >();

  for (const o of outreaches) {
    if (!o.talent) continue;
    const t = byTalent.get(o.talent.id) ?? {
      id: o.talent.id,
      name: o.talent.full_name,
      ig: o.talent.ig_handle,
      total: 0,
      active: 0,
      confirmed: 0,
      paid_amount: 0,
      last_at: null,
    };
    t.total += 1;
    if (ACTIVE_STATUSES.has(o.status)) t.active += 1;
    if (["confirmed", "live", "paid"].includes(o.status)) t.confirmed += 1;
    if (o.status === "paid") t.paid_amount += o.agreed_amount ?? 0;
    if (!t.last_at || o.updated_at > t.last_at) t.last_at = o.updated_at;
    byTalent.set(o.talent.id, t);
  }
  const connectedTalents = Array.from(byTalent.values()).sort(
    (a, b) => b.total - a.total,
  );

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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Connected talents
            <Badge variant="outline">{connectedTalents.length}</Badge>
          </CardTitle>
          <CardDescription>
            Influencers from your roster who&apos;ve been pitched to this brand.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border text-sm">
            {connectedTalents.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/talents/${t.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
                >
                  <Avatar>
                    <AvatarFallback>{initials(t.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      @{t.ig}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t.total} pitch{t.total === 1 ? "" : "es"}
                  </span>
                  {t.active > 0 ? (
                    <Badge variant="primary" className="text-[10px]">
                      {t.active} active
                    </Badge>
                  ) : null}
                  {t.paid_amount > 0 ? (
                    <span className="text-xs text-success tabular-nums">
                      {formatINR(t.paid_amount)} paid
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {fmtRelative(t.last_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Outreach history
            <Badge variant="outline">{outreaches.length}</Badge>
          </CardTitle>
        </CardHeader>
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
                    className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
                  >
                    <ChannelIcon channel={o.channel} />
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {o.talent?.full_name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{o.talent?.ig_handle}
                      </div>
                    </div>
                    {o.direction ? (
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {o.direction}
                      </Badge>
                    ) : (
                      <span />
                    )}
                    <StatusPill status={o.status} />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatINR(o.agreed_amount ?? o.negotiated_amount ?? o.proposed_amount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtRelative(lastAct)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
