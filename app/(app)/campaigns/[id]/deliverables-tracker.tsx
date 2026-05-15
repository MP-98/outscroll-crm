"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/status-pill";
import { setDeliverableDone } from "@/server/actions/campaign-outreaches";
import { cn } from "@/lib/utils";
import type {
  CampaignOutreachStatus,
  CampaignPaymentStatus,
} from "@/lib/supabase/types";

export interface DeliverableRow {
  id: string;
  who_name: string;
  who_handle: string;
  who_kind: "external" | "talent";
  status: CampaignOutreachStatus;
  payment_status: CampaignPaymentStatus;
  deliverables: string | null;
  deliverable_done: boolean;
}

export function DeliverablesTracker({ rows }: { rows: DeliverableRow[] }) {
  // Only show rows that have committed (confirmed and beyond).
  const committed = rows.filter((r) =>
    ["confirmed", "live", "paid"].includes(r.status),
  );

  if (committed.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Deliverables tracker</CardTitle>
          <CardDescription>
            Shows up here once an influencer is at Confirmed or beyond.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No committed deliverables yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const done = committed.filter((r) => r.deliverable_done).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Deliverables tracker
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {done} of {committed.length} done
          </span>
        </CardTitle>
        <CardDescription>
          Each row tracks a confirmed influencer&apos;s committed deliverable.
          Mark done independently of pipeline status.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border text-sm">
          {committed.map((r) => (
            <TrackerRow key={r.id} row={r} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TrackerRow({ row }: { row: DeliverableRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(row.deliverable_done);

  function toggle() {
    const next = !done;
    start(async () => {
      try {
        await setDeliverableDone(row.id, next);
        setDone(next);
        toast.success(next ? "Marked done" : "Marked pending");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <li className="px-4 py-3 flex items-start gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors",
          done
            ? "bg-success border-success text-success-foreground"
            : "border-border hover:border-foreground",
        )}
        aria-label={done ? "Mark pending" : "Mark done"}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : done ? (
          <Check className="h-3 w-3" />
        ) : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/campaign-outreaches/${row.id}`}
            className="font-medium hover:text-primary truncate"
          >
            {row.who_name}
          </Link>
          <span className="text-xs text-muted-foreground">@{row.who_handle}</span>
          {row.who_kind === "talent" ? (
            <Badge variant="primary" className="text-[10px]">
              Talent
            </Badge>
          ) : null}
          <StatusPill status={row.status} />
          <Badge variant="outline" className="capitalize text-[10px] ml-auto">
            {row.payment_status}
          </Badge>
        </div>
        {row.deliverables ? (
          <p
            className={cn(
              "mt-1 text-sm whitespace-pre-wrap",
              done && "line-through text-muted-foreground",
            )}
          >
            {row.deliverables}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground italic">
            No deliverable text set. Add one from the campaign-outreach detail
            page.
          </p>
        )}
      </div>
    </li>
  );
}
