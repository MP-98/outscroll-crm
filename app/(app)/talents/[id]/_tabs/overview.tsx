import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChannelIcon } from "@/components/channel-icon";
import { fmtRelative } from "@/lib/date";
import type { Talent, TalentContact, Outreach } from "@/lib/supabase/types";

export function OverviewTab({
  talent,
  contacts,
  outreaches,
}: {
  talent: Talent;
  contacts: TalentContact[];
  outreaches: Array<Outreach & { brand?: { id: string; name: string } | null }>;
}) {
  const recent = outreaches.slice(0, 8);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground">No outreaches yet.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {recent.map((o) => (
                  <li key={o.id} className="px-4 py-2.5 flex items-center gap-3">
                    <ChannelIcon channel={o.channel} />
                    <Link
                      href={`/outreaches/${o.id}`}
                      className="font-medium hover:text-primary truncate"
                    >
                      {o.brand?.name ?? "Brand"}
                    </Link>
                    <Badge variant="outline" className="capitalize">
                      {o.status.replace("_", " ")}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {fmtRelative(o.updated_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Detail label="City" value={talent.city ?? "—"} />
            <Detail label="Languages" value={(talent.languages ?? []).join(", ") || "—"} />
            <Detail
              label="Niches"
              value={(talent.niches ?? []).map((n) => n).join(", ") || "—"}
            />
            <Detail
              label="Tags"
              value={(talent.tags ?? []).join(", ") || "—"}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Primary contacts</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {contacts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No contacts on file.</p>
            ) : (
              <ul className="space-y-1.5">
                {contacts.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <ChannelIcon channel={c.kind} />
                    <span className="text-foreground truncate">{c.value}</span>
                    {c.is_primary ? (
                      <Badge variant="primary" className="ml-auto text-[10px]">
                        primary
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}
