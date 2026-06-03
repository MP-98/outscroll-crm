"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Search, Sparkles } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { igUrl, normalizeIgHandle } from "@/lib/ig";

export type CommercialStatus = "pending" | "received";

export interface InfluencerRow {
  id: string;
  full_name: string | null;
  ig_handle: string;
  ig_followers: string | null;
  avg_reel_views: string | null;
  niches: string[];
  city: string | null;
  rate_reel: string | null;
  rate_story: string | null;
  rate_post: string | null;
  tags: string[];
  notes: string | null;
  /** Derived: any rate filled → "received", else "pending". Computed on the server. */
  commercial_status: CommercialStatus;
  campaign_count: number;
  last_activity: string | null;
}

interface Props {
  rows: InfluencerRow[];
  niches: string[];
}

export function InfluencersTable({ rows, niches }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [niche, setNiche] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");
  const [commercials, setCommercials] = useState<"all" | CommercialStatus>("all");

  const cities = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.city).filter(Boolean) as string[])).sort(),
    [rows],
  );

  // Case-insensitive dedup of tags across rows. First-seen casing wins.
  const allTags = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) {
      for (const t of r.tags) {
        const key = t.toLowerCase();
        if (!seen.has(key)) seen.set(key, t);
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );
  }, [rows]);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (
      q &&
      !(r.full_name?.toLowerCase().includes(q) ?? false) &&
      !r.ig_handle.toLowerCase().includes(q) &&
      !r.tags.some((t) => t.toLowerCase().includes(q)) &&
      !r.niches.some((n) => n.toLowerCase().includes(q))
    )
      return false;
    if (niche !== "all" && !r.niches.includes(niche)) return false;
    if (city !== "all" && r.city !== city) return false;
    // Case-insensitive: filtering by "Fashion" matches rows tagged "fashion".
    if (
      tag !== "all" &&
      !r.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
    )
      return false;
    if (commercials !== "all" && r.commercial_status !== commercials) return false;
    return true;
  });

  const columns: ColumnDef<InfluencerRow>[] = [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.full_name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "ig_handle",
      header: "Instagram",
      cell: ({ row }) => (
        <a
          href={igUrl(row.original.ig_handle)}
          target="_blank"
          rel="noopener"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
        >
          @{normalizeIgHandle(row.original.ig_handle)}
          <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      accessorKey: "ig_followers",
      header: "Followers",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.ig_followers || "—"}
        </span>
      ),
    },
    {
      accessorKey: "avg_reel_views",
      header: "Avg reels",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.avg_reel_views || "—"}
        </span>
      ),
    },
    {
      accessorKey: "niches",
      header: "Niches",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[14rem]">
          {row.original.niches.slice(0, 3).map((n) => (
            <Badge key={n} className="text-[10px]">
              {n}
            </Badge>
          ))}
          {row.original.niches.length > 3 ? (
            <span className="text-[11px] text-muted-foreground">
              +{row.original.niches.length - 3}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "tags",
      header: "Tags",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[16rem]">
          {row.original.tags.length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <>
              {row.original.tags.slice(0, 3).map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">
                  {t}
                </Badge>
              ))}
              {row.original.tags.length > 3 ? (
                <span className="text-[11px] text-muted-foreground">
                  +{row.original.tags.length - 3}
                </span>
              ) : null}
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: "commercial_status",
      header: "Commercials",
      cell: ({ row }) => (
        <Badge
          variant={row.original.commercial_status === "received" ? "success" : "default"}
          className="capitalize"
        >
          {row.original.commercial_status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[12rem] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name, handle, niche or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={niche} onValueChange={setNiche}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Niche" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All niches</SelectItem>
            {niches.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {allTags.length === 0 ? (
              <SelectItem value="__none" disabled>
                No tags yet
              </SelectItem>
            ) : (
              allTags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Select
          value={commercials}
          onValueChange={(v) => setCommercials(v as "all" | CommercialStatus)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Commercials" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All commercials</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="received">Received</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length} of {rows.length}
        </span>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => router.push(`/influencers/${row.id}`)}
          emptyState={
            <EmptyState
              icon={<Sparkles />}
              title="No influencers match"
              description="Adjust filters or add an influencer to the pool."
            />
          }
        />
      </div>
    </div>
  );
}
