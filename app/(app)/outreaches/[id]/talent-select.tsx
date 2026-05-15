"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOutreach } from "@/server/actions/outreaches";

interface Option {
  id: string;
  label: string;
}

export function TalentSelect({
  outreachId,
  talentId,
  talents,
}: {
  outreachId: string;
  talentId: string | null;
  talents: Option[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!talentId) {
    // Inline assign affordance — prominent because the outreach is incomplete.
    return (
      <Select
        value="tbd"
        onValueChange={(v) => {
          if (v === "tbd") return;
          start(async () => {
            try {
              await updateOutreach(outreachId, { talent_id: v });
              toast.success("Talent assigned");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          });
        }}
      >
        <SelectTrigger
          className="h-7 gap-1.5 border-dashed border-primary/40 bg-primary/5 text-xs"
          disabled={pending}
        >
          <UserPlus className="h-3 w-3 text-primary" />
          <SelectValue placeholder="Assign talent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tbd" disabled>
            — Decide later —
          </SelectItem>
          {talents.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select
      value={talentId}
      onValueChange={(v) =>
        start(async () => {
          try {
            await updateOutreach(outreachId, {
              talent_id: v === "tbd" ? null : v,
            });
            toast.success(v === "tbd" ? "Talent unassigned" : "Talent updated");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          }
        })
      }
    >
      <SelectTrigger
        className="h-7 w-auto gap-1.5 border-none bg-transparent px-1.5 text-sm shadow-none hover:bg-accent"
        disabled={pending}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tbd">— Unassign —</SelectItem>
        {talents.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
