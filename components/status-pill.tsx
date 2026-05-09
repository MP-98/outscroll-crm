import { cn } from "@/lib/utils";
import type { OutreachStatus, CampaignOutreachStatus, TalentStatus, CampaignStatus, ManagedBrandStatus } from "@/lib/supabase/types";

type AnyStatus =
  | OutreachStatus
  | CampaignOutreachStatus
  | TalentStatus
  | CampaignStatus
  | ManagedBrandStatus;

const STATUS_TONE: Record<string, string> = {
  // Talent / managed brand
  active: "bg-success/10 text-success border-success/20",
  paused: "bg-warning/10 text-warning border-warning/20",
  offboarded: "bg-muted text-muted-foreground border-border",
  churned: "bg-muted text-muted-foreground border-border",

  // Outreach pipeline
  prospected: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20",
  shortlisted: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20",
  contacted: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20",
  in_conversation: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20",
  brief_received: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20",
  negotiating: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  live: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
  paid: "bg-success/10 text-success border-success/20",

  // branches
  on_hold: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20",
  lost: "bg-destructive/10 text-destructive border-destructive/20",

  // campaigns
  planning: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20",
  wrapping: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20",
  done: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusPill({ status, className }: { status: AnyStatus; className?: string }) {
  const tone = STATUS_TONE[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium capitalize tracking-wide",
        tone,
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
