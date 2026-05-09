import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/currency";
import { fmtDate } from "@/lib/date";
import type { Outreach } from "@/lib/supabase/types";

interface Props {
  total_confirmed: number;
  total_paid: number;
  total_paid_amount: number;
  total_commission: number;
  recent_paid: Outreach[];
}

export function RevenueTab({
  total_confirmed,
  total_paid,
  total_paid_amount,
  total_commission,
  recent_paid,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Confirmed (lifetime)" value={String(total_confirmed)} />
        <Stat label="Paid (lifetime)" value={String(total_paid)} />
        <Stat label="Paid value" value={formatINR(total_paid_amount)} />
        <Stat
          label="Commission earned"
          value={formatINR(total_commission)}
          className="sm:col-span-3"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent paid deals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recent_paid.length === 0 ? (
            <p className="px-4 py-6 text-xs text-muted-foreground">No paid deals yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {recent_paid.map((o) => (
                <li key={o.id} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-foreground">Outreach #{o.id.slice(0, 6)}</span>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {formatINR(o.agreed_amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {fmtDate(o.paid_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${className ?? ""}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-1 tabular-nums">{value}</div>
    </div>
  );
}
