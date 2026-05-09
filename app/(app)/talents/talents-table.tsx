"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Search, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusPill } from "@/components/status-pill";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCompact } from "@/lib/currency";
import { fmtRelative } from "@/lib/date";

export interface TalentRow {
  id: string;
  full_name: string;
  ig_handle: string;
  ig_followers: number | null;
  avg_reel_views: number | null;
  niches: string[];
  city: string | null;
  status: "active" | "paused" | "offboarded";
  exclusivity: "exclusive" | "non_exclusive";
  manager_name: string | null;
  manager_id: string | null;
  active_outreaches: number;
  last_activity: string | null;
}

interface Props {
  rows: TalentRow[];
  managers: Array<{ id: string; name: string }>;
  niches: string[];
}

export function TalentsTable({ rows, managers, niches }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [niche, setNiche] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [exclusivity, setExclusivity] = useState<string>("all");
  const [manager, setManager] = useState<string>("all");

  const cities = useMemo(
    () => Array.from(new Set(rows.map((r) => r.city).filter(Boolean) as string[])).sort(),
    [rows],
  );

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q && !r.full_name.toLowerCase().includes(q) && !r.ig_handle.toLowerCase().includes(q))
      return false;
    if (niche !== "all" && !r.niches.includes(niche)) return false;
    if (city !== "all" && r.city !== city) return false;
    if (status !== "all" && r.status !== status) return false;
    if (exclusivity !== "all" && r.exclusivity !== exclusivity) return false;
    if (manager !== "all" && r.manager_id !== manager) return false;
    return true;
  });

  const columns: ColumnDef<TalentRow>[] = [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.full_name}</span>
      ),
    },
    {
      accessorKey: "ig_handle",
      header: "Instagram",
      cell: ({ row }) => (
        <a
          href={`https://instagram.com/${row.original.ig_handle}`}
          target="_blank"
          rel="noopener"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
        >
          @{row.original.ig_handle}
          <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      accessorKey: "ig_followers",
      header: "Followers",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatCompact(row.original.ig_followers)}
        </span>
      ),
    },
    {
      accessorKey: "avg_reel_views",
      header: "Avg reels",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatCompact(row.original.avg_reel_views)}
        </span>
      ),
    },
    {
      accessorKey: "niches",
      header: "Niches",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[16rem]">
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusPill status={row.original.status} />,
    },
    {
      accessorKey: "exclusivity",
      header: "Excl.",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground capitalize">
          {row.original.exclusivity.replace("_", " ")}
        </span>
      ),
    },
    {
      accessorKey: "manager_name",
      header: "Manager",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.manager_name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "active_outreaches",
      header: "Active",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">{row.original.active_outreaches}</span>
      ),
    },
    {
      accessorKey: "last_activity",
      header: "Last activity",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {fmtRelative(row.original.last_activity)}
        </span>
      ),
    },
  ];

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[12rem] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name or handle…"
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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="offboarded">Offboarded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={exclusivity} onValueChange={setExclusivity}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Exclusivity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="exclusive">Exclusive</SelectItem>
            <SelectItem value="non_exclusive">Non-exclusive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={manager} onValueChange={setManager}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any manager</SelectItem>
            {managers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
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
          onRowClick={(row) => router.push(`/talents/${row.id}`)}
          emptyState={
            <EmptyState
              icon={<Users />}
              title="No talents match these filters"
              description="Adjust filters or add a new talent to get started."
            />
          }
        />
      </div>
    </div>
  );
}
