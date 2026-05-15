"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { XCircle, Ban, CalendarOff, Pause, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  transitionStatus,
  updateOutreach,
} from "@/server/actions/outreaches";
import {
  transitionCampaignOutreachStatus,
  updateCampaignOutreach,
} from "@/server/actions/campaign-outreaches";

type Source = "outreach" | "campaign";

interface Props {
  id: string;
  source: Source;
  /** Optional: visual variant. "icon" = small icon-only trigger; "compact" =
   *  icon + 'Close' label. Defaults to "icon". */
  variant?: "icon" | "compact";
  className?: string;
}

export function CloseOutreachMenu({
  id,
  source,
  variant = "icon",
  className,
}: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function markLost() {
    start(async () => {
      try {
        if (source === "campaign") {
          await transitionCampaignOutreachStatus(id, "lost");
        } else {
          await transitionStatus(id, "lost");
        }
        toast.success("Marked as Lost");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function markOnHold() {
    start(async () => {
      try {
        if (source === "campaign") {
          await transitionCampaignOutreachStatus(id, "on_hold");
        } else {
          await transitionStatus(id, "on_hold");
        }
        toast.success("Parked (on hold)");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function clearFollowup() {
    start(async () => {
      try {
        if (source === "campaign") {
          await updateCampaignOutreach(id, { next_followup_at: null });
        } else {
          await updateOutreach(id, { next_followup_at: null });
        }
        toast.success("Follow-up cleared");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50",
          variant === "compact" && "gap-1.5 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent hover:text-foreground",
          className,
        )}
        disabled={pending}
        title="Close / remove from inbox"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        {variant === "compact" ? "Close" : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={markLost} disabled={pending}>
          <Ban className="text-destructive" />
          <div className="flex flex-col">
            <span>Mark as Lost</span>
            <span className="text-[10px] text-muted-foreground">
              Brand said no — closes the outreach
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={clearFollowup} disabled={pending}>
          <CalendarOff />
          <div className="flex flex-col">
            <span>No follow-up needed</span>
            <span className="text-[10px] text-muted-foreground">
              Hide from inbox, keep status as-is
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={markOnHold} disabled={pending}>
          <Pause />
          <div className="flex flex-col">
            <span>Park (on hold)</span>
            <span className="text-[10px] text-muted-foreground">
              Pause for now — revisit later
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
