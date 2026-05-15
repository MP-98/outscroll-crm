"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { LayoutGrid, Rows3, Sparkles } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { formatINR } from "@/lib/currency";
import { fmtDate, fmtRelative } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  setPaymentStatus,
  transitionCampaignOutreachStatus,
} from "@/server/actions/campaign-outreaches";
import type {
  CampaignOutreachStatus,
  CampaignPaymentStatus,
} from "@/lib/supabase/types";

export interface CampaignOutreachRow {
  id: string;
  who_name: string;
  who_handle: string;
  who_kind: "external" | "talent";
  status: CampaignOutreachStatus;
  payment_status: CampaignPaymentStatus;
  agreed_amount: number | null;
  proposed_amount: number | null;
  next_followup_at: string;
  updated_at: string;
  created_at: string;
}

const STAGES: Array<{ id: CampaignOutreachStatus; label: string }> = [
  { id: "shortlisted", label: "Shortlisted" },
  { id: "contacted", label: "Contacted" },
  { id: "in_conversation", label: "In conversation" },
  { id: "negotiating", label: "Negotiating" },
  { id: "confirmed", label: "Confirmed" },
  { id: "live", label: "Live" },
  { id: "paid", label: "Paid" },
];

const PAYMENT_STATUSES: CampaignPaymentStatus[] = [
  "pending",
  "invoiced",
  "paid",
  "overdue",
  "na",
];

export function InfluencerOutreachView({
  rows,
}: {
  rows: CampaignOutreachRow[];
}) {
  const [view, setView] = useState<"table" | "kanban">("table");

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles />}
        title="No influencers added yet"
        description="Use the “Add influencers” button above to shortlist creators from the pool or your talent roster."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
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
      {view === "table" ? <TableView rows={rows} /> : <KanbanView rows={rows} />}
    </div>
  );
}

function TableView({ rows }: { rows: CampaignOutreachRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="text-left font-medium px-3 py-2">Influencer</th>
            <th className="text-left font-medium px-3 py-2">Stage</th>
            <th className="text-left font-medium px-3 py-2">Payment</th>
            <th className="text-right font-medium px-3 py-2">Amount</th>
            <th className="text-left font-medium px-3 py-2">Follow-up</th>
            <th className="text-left font-medium px-3 py-2">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <TableRow key={r.id} row={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({ row }: { row: CampaignOutreachRow }) {
  const router = useRouter();
  const [, start] = useTransition();
  const overdue = new Date(row.next_followup_at) < new Date(new Date().toDateString());
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-accent">
      <td className="px-3 py-2">
        <Link
          href={`/campaign-outreaches/${row.id}`}
          className="font-medium hover:text-primary"
        >
          {row.who_name}
        </Link>
        <span className="text-xs text-muted-foreground ml-1.5">@{row.who_handle}</span>
        {row.who_kind === "talent" ? (
          <Badge variant="primary" className="ml-1.5 text-[10px]">
            Talent
          </Badge>
        ) : null}
      </td>
      <td className="px-3 py-2">
        <StatusPill status={row.status} />
      </td>
      <td className="px-3 py-2">
        <Select
          value={row.payment_status}
          onValueChange={(v) =>
            start(async () => {
              try {
                await setPaymentStatus(row.id, v as CampaignPaymentStatus);
                toast.success("Payment status updated");
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            })
          }
        >
          <SelectTrigger className="h-7 w-32 text-xs capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STATUSES.map((p) => (
              <SelectItem key={p} value={p} className="capitalize">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2 text-right tabular-nums">
        {formatINR(row.agreed_amount ?? row.proposed_amount)}
      </td>
      <td className="px-3 py-2">
        <span
          className={cn(
            "text-xs tabular-nums",
            overdue ? "text-destructive font-medium" : "text-muted-foreground",
          )}
        >
          {fmtDate(row.next_followup_at)}
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {fmtRelative(row.updated_at)}
      </td>
    </tr>
  );
}

function KanbanView({ rows }: { rows: CampaignOutreachRow[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const grouped = STAGES.reduce<Record<string, CampaignOutreachRow[]>>(
    (acc, s) => {
      acc[s.id] = [];
      return acc;
    },
    {},
  );
  for (const r of rows) {
    if (grouped[r.status]) grouped[r.status].push(r);
  }

  function moveTo(id: string, status: CampaignOutreachStatus) {
    start(async () => {
      try {
        await transitionCampaignOutreachStatus(id, status);
        toast.success("Stage updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max px-1">
        {STAGES.map((s) => (
          <div
            key={s.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (id) moveTo(id, s.id);
              setDraggingId(null);
            }}
            className="w-72 shrink-0 rounded-lg border border-border bg-card flex flex-col"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs">
              <span className="font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {grouped[s.id].length}
              </span>
            </div>
            <div className="flex-1 p-2 space-y-2 max-h-[calc(100svh-280px)] overflow-y-auto">
              {grouped[s.id].length === 0 ? (
                <div className="px-2 py-6 text-[11px] text-muted-foreground text-center">
                  Drop here
                </div>
              ) : (
                grouped[s.id].map((r) => {
                  const days = differenceInCalendarDays(new Date(), parseISO(r.created_at));
                  return (
                    <div
                      key={r.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", r.id);
                        setDraggingId(r.id);
                      }}
                      onClick={() => router.push(`/campaign-outreaches/${r.id}`)}
                      className={cn(
                        "rounded-md border border-border bg-background p-2.5 cursor-pointer hover:border-ring transition-colors",
                        draggingId === r.id && "opacity-60",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate flex-1">
                          {r.who_name}
                        </span>
                        {r.who_kind === "talent" ? (
                          <Badge variant="primary" className="text-[9px]">
                            T
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        @{r.who_handle}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                        <span>
                          {formatINR(r.agreed_amount ?? r.proposed_amount)}
                        </span>
                        <span className="tabular-nums">{days}d</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
