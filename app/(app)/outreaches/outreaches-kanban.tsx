"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { ChannelIcon } from "@/components/channel-icon";
import { CloseOutreachMenu } from "@/components/close-outreach-menu";
import { transitionStatus } from "@/server/actions/outreaches";
import { formatINR } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { OutreachStatus } from "@/lib/supabase/types";
import type { OutreachRow } from "./outreaches-view";

const STAGES: Array<{ id: OutreachStatus; label: string }> = [
  { id: "prospected", label: "Prospected" },
  { id: "contacted", label: "Contacted" },
  { id: "in_conversation", label: "In conversation" },
  { id: "brief_received", label: "Brief received" },
  { id: "negotiating", label: "Negotiating" },
  { id: "confirmed", label: "Confirmed" },
  { id: "live", label: "Live" },
  { id: "paid", label: "Paid" },
];

export function OutreachKanban({ rows }: { rows: OutreachRow[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const grouped = STAGES.reduce<Record<string, OutreachRow[]>>((acc, s) => {
    acc[s.id] = [];
    return acc;
  }, {});
  for (const row of rows) {
    if (grouped[row.status]) grouped[row.status].push(row);
  }

  function moveTo(id: string, status: OutreachStatus) {
    start(async () => {
      try {
        await transitionStatus(id, status);
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
            onDragOver={(e) => {
              e.preventDefault();
            }}
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
              <span className="tabular-nums text-muted-foreground">{grouped[s.id].length}</span>
            </div>
            <div className="flex-1 p-2 space-y-2 max-h-[calc(100svh-220px)] overflow-y-auto">
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
                      onClick={() => router.push(`/outreaches/${r.id}`)}
                      className={cn(
                        "rounded-md border border-border bg-background p-2.5 cursor-pointer hover:border-ring transition-colors",
                        draggingId === r.id && "opacity-60",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <ChannelIcon channel={r.channel} />
                        <div className="text-xs font-medium truncate flex-1">
                          {r.talent_name}
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <CloseOutreachMenu id={r.id} source="outreach" />
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        ↔ {r.brand_name}
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
