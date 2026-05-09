"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Rows3, Search, MessagesSquare } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/status-pill";
import { ChannelIcon, ChannelLabel } from "@/components/channel-icon";
import { formatINR } from "@/lib/currency";
import { fmtDate, fmtRelative } from "@/lib/date";
import { OutreachKanban } from "./outreaches-kanban";
import type { OutreachStatus } from "@/lib/supabase/types";

export interface OutreachRow {
  id: string;
  talent_id: string;
  brand_id: string;
  talent_name: string;
  brand_name: string;
  status: OutreachStatus;
  channel: "ig_dm" | "linkedin" | "whatsapp" | "email" | "call" | "other";
  owner_id: string | null;
  owner_name: string | null;
  agreed_amount: number | null;
  proposed_amount: number | null;
  next_followup_at: string;
  updated_at: string;
  created_at: string;
}

export function OutreachesView({
  rows,
  owners,
}: {
  rows: OutreachRow[];
  owners: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [channel, setChannel] = useState<string>("all");
  const [owner, setOwner] = useState<string>("all");

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (
      q &&
      !r.talent_name.toLowerCase().includes(q) &&
      !r.brand_name.toLowerCase().includes(q)
    )
      return false;
    if (status !== "all" && r.status !== status) return false;
    if (channel !== "all" && r.channel !== channel) return false;
    if (owner !== "all" && r.owner_id !== owner) return false;
    return true;
  });

  const columns: ColumnDef<OutreachRow>[] = [
    {
      accessorKey: "talent_name",
      header: "Talent",
      cell: ({ row }) => <span className="font-medium">{row.original.talent_name}</span>,
    },
    {
      accessorKey: "brand_name",
      header: "Brand",
      cell: ({ row }) => <span className="text-foreground">{row.original.brand_name}</span>,
    },
    {
      accessorKey: "status",
      header: "Stage",
      cell: ({ row }) => <StatusPill status={row.original.status} />,
    },
    {
      accessorKey: "channel",
      header: "Channel",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ChannelIcon channel={row.original.channel} />
          {ChannelLabel(row.original.channel)}
        </span>
      ),
    },
    {
      accessorKey: "owner_name",
      header: "Owner",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.owner_name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "agreed_amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatINR(row.original.agreed_amount ?? row.original.proposed_amount)}
        </span>
      ),
    },
    {
      accessorKey: "next_followup_at",
      header: "Follow-up",
      cell: ({ row }) => {
        const d = row.original.next_followup_at;
        const past = new Date(d) < new Date(new Date().toDateString());
        return (
          <span
            className={
              past
                ? "text-destructive text-xs font-medium"
                : "text-xs text-muted-foreground"
            }
          >
            {fmtDate(d)}
          </span>
        );
      },
    },
    {
      accessorKey: "updated_at",
      header: "Last activity",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{fmtRelative(row.original.updated_at)}</span>
      ),
    },
  ];

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[12rem] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search talent or brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any stage</SelectItem>
            {[
              "prospected",
              "contacted",
              "in_conversation",
              "brief_received",
              "negotiating",
              "confirmed",
              "live",
              "paid",
              "lost",
              "on_hold",
            ].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any channel</SelectItem>
            <SelectItem value="ig_dm">IG DM</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any owner</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {rows.length}
        </span>
        <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5">
          <Button
            type="button"
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
          >
            <Rows3 />
            Table
          </Button>
          <Button
            type="button"
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid />
            Kanban
          </Button>
        </div>
      </div>

      {view === "table" ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(row) => router.push(`/outreaches/${row.id}`)}
            emptyState={
              <EmptyState
                icon={<MessagesSquare />}
                title="No outreaches match"
                description="Adjust filters or start a new outreach."
              />
            }
          />
        </div>
      ) : (
        <OutreachKanban rows={filtered} />
      )}
    </div>
  );
}
