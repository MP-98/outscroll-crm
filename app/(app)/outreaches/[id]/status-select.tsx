"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { transitionStatus } from "@/server/actions/outreaches";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OutreachStatus } from "@/lib/supabase/types";

const ALL: OutreachStatus[] = [
  "not_contacted",
  "prospected",
  "contacted",
  "in_conversation",
  "brief_received",
  "negotiating",
  "confirmed",
  "live",
  "paid",
  "on_hold",
  "lost",
];

export function StatusSelect({ id, status }: { id: string; status: OutreachStatus }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Select
      value={status}
      onValueChange={(v) => {
        const next = v as OutreachStatus;
        let lostReason: string | undefined;
        if (next === "lost") {
          const r = window.prompt("Lost reason?");
          if (r === null) return;
          lostReason = r || undefined;
        }
        start(async () => {
          try {
            await transitionStatus(id, next, lostReason);
            toast.success(`Moved to ${next.replace("_", " ")}`);
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          }
        });
      }}
    >
      <SelectTrigger className="w-44 capitalize" disabled={pending}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ALL.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">
            {s.replace("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
