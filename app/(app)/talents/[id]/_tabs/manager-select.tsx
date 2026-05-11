"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Loader2, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { reassignTalentManager } from "@/server/actions/talents";

interface Option {
  id: string;
  name: string;
}

interface Props {
  talentId: string;
  currentManagerId: string | null;
  currentManagerName: string | null;
  managers: Option[];
  canReassign: boolean;
}

export function ManagerSelect({
  talentId,
  currentManagerId,
  currentManagerName,
  managers,
  canReassign,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  function pick(managerId: string | null) {
    if (managerId === currentManagerId) {
      setOpen(false);
      return;
    }
    start(async () => {
      try {
        await reassignTalentManager(talentId, managerId);
        toast.success("Manager updated");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  if (!canReassign) {
    return (
      <span>
        Manager:{" "}
        <span className="text-foreground">{currentManagerName ?? "Unassigned"}</span>
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          disabled={pending}
        >
          Manager:{" "}
          <span className="text-foreground font-medium">
            {currentManagerName ?? "Unassigned"}
          </span>
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3 opacity-70" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-1">
          Assign manager
        </div>
        <button
          type="button"
          onClick={() => pick(null)}
          className={cn(
            "flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent",
            currentManagerId === null && "bg-accent/60",
          )}
        >
          <span className="text-muted-foreground italic">Unassigned</span>
          {currentManagerId === null ? <Check className="h-3.5 w-3.5" /> : null}
        </button>
        <div className="my-1 h-px bg-border" />
        {managers.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => pick(m.id)}
            className={cn(
              "flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent",
              currentManagerId === m.id && "bg-accent/60",
            )}
          >
            <span className="truncate">{m.name}</span>
            {currentManagerId === m.id ? <Check className="h-3.5 w-3.5" /> : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
