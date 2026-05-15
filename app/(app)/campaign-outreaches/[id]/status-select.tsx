"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { transitionCampaignOutreachStatus } from "@/server/actions/campaign-outreaches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CampaignOutreachStatus } from "@/lib/supabase/types";

const ALL: CampaignOutreachStatus[] = [
  "shortlisted",
  "contacted",
  "in_conversation",
  "negotiating",
  "confirmed",
  "live",
  "paid",
  "on_hold",
  "lost",
];

export function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: CampaignOutreachStatus;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Select
      value={status}
      onValueChange={(v) => {
        const next = v as CampaignOutreachStatus;
        start(async () => {
          try {
            await transitionCampaignOutreachStatus(id, next);
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
