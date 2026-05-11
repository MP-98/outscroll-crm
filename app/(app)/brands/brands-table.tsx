"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Search, Building2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { fmtRelative } from "@/lib/date";
import { igUrl, normalizeIgHandle } from "@/lib/ig";

export interface BrandRow {
  id: string;
  name: string;
  industry: string | null;
  ig_handle: string | null;
  website: string | null;
  tags: string[];
  active_outreaches: number;
  lifetime_closed: number;
  last_contacted: string | null;
}

export function BrandsTable({ rows }: { rows: BrandRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      (r.industry?.toLowerCase().includes(q) ?? false) ||
      (r.ig_handle?.toLowerCase().includes(q) ?? false)
    );
  });

  const columns: ColumnDef<BrandRow>[] = [
    {
      accessorKey: "name",
      header: "Brand",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.industry ?? "—"}</span>
      ),
    },
    {
      accessorKey: "ig_handle",
      header: "Instagram",
      cell: ({ row }) =>
        row.original.ig_handle ? (
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
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "website",
      header: "Site",
      cell: ({ row }) =>
        row.original.website ? (
          <a
            href={row.original.website}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary truncate"
          >
            {row.original.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "active_outreaches",
      header: "Active",
      cell: ({ row }) => <span className="tabular-nums">{row.original.active_outreaches}</span>,
    },
    {
      accessorKey: "lifetime_closed",
      header: "Closed",
      cell: ({ row }) => <span className="tabular-nums">{row.original.lifetime_closed}</span>,
    },
    {
      accessorKey: "last_contacted",
      header: "Last contact",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{fmtRelative(row.original.last_contacted)}</span>
      ),
    },
    {
      accessorKey: "tags",
      header: "Tags",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.tags ?? []).slice(0, 3).map((t) => (
            <Badge key={t} variant="outline" className="text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search brand, industry, handle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {rows.length}
        </span>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => router.push(`/brands/${row.id}`)}
          emptyState={
            <EmptyState
              icon={<Building2 />}
              title="No brands yet"
              description="Add a brand to start tracking outreaches and POCs."
            />
          }
        />
      </div>
    </div>
  );
}
