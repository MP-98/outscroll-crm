"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Megaphone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/status-pill";
import { formatINR } from "@/lib/currency";
import { fmtDate, fmtRelative } from "@/lib/date";

export interface CampaignRow {
  id: string;
  name: string;
  managed_brand_id: string;
  managed_brand_name: string;
  status:
    | "planning"
    | "live"
    | "wrapping"
    | "done"
    | "cancelled";
  budget: number | null;
  starts_on: string | null;
  ends_on: string | null;
  total_outreaches: number;
  confirmed_outreaches: number;
  paid_outreaches: number;
  updated_at: string;
}

export function CampaignsView({
  rows,
  managedBrands,
}: {
  rows: CampaignRow[];
  managedBrands: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (
      q &&
      !r.name.toLowerCase().includes(q) &&
      !r.managed_brand_name.toLowerCase().includes(q)
    )
      return false;
    if (status !== "all" && r.status !== status) return false;
    if (brand !== "all" && r.managed_brand_id !== brand) return false;
    return true;
  });

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[12rem] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search campaign or brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="wrapping">Wrapping</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any brand</SelectItem>
            {managedBrands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {rows.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Megaphone />}
          title="No campaigns match"
          description="Adjust filters or start a new campaign."
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="text-left font-medium px-3 py-2">Campaign</th>
                <th className="text-left font-medium px-3 py-2">Brand</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
                <th className="text-right font-medium px-3 py-2">Budget</th>
                <th className="text-right font-medium px-3 py-2">Progress</th>
                <th className="text-left font-medium px-3 py-2">Window</th>
                <th className="text-left font-medium px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/campaigns/${c.id}`)}
                  className="border-b border-border last:border-b-0 hover:bg-accent cursor-pointer"
                >
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/managed-brands/${c.managed_brand_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {c.managed_brand_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatINR(c.budget)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="text-xs tabular-nums">
                      {c.confirmed_outreaches}
                      <span className="text-muted-foreground">
                        /{c.total_outreaches}
                      </span>
                    </span>
                    {c.paid_outreaches > 0 ? (
                      <Badge variant="success" className="ml-1.5 text-[10px]">
                        {c.paid_outreaches} paid
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {c.starts_on ? fmtDate(c.starts_on) : "—"}
                    {c.ends_on ? ` → ${fmtDate(c.ends_on)}` : ""}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {fmtRelative(c.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
