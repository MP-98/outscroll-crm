"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logActivity } from "@/server/actions/outreaches";
import type { ActivityInput } from "@/lib/validations/outreach";

export function ActivityComposer({ outreachId }: { outreachId: string }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [channel, setChannel] = useState<ActivityInput["channel"]>("note");
  const [direction, setDirection] = useState<ActivityInput["direction"]>("outbound");
  const [pending, start] = useTransition();
  const router = useRouter();

  function reset() {
    setSummary("");
    setChannel("note");
    setDirection("outbound");
    setOpen(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    start(async () => {
      try {
        await logActivity({
          outreach_id: outreachId,
          channel,
          direction,
          summary: summary.trim(),
          attachment_url: null,
        });
        toast.success("Activity logged");
        reset();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Log activity
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Select value={channel} onValueChange={(v) => setChannel(v as ActivityInput["channel"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="note">Note</SelectItem>
            <SelectItem value="ig_dm">Instagram DM</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={direction ?? "outbound"}
          onValueChange={(v) => setDirection(v as ActivityInput["direction"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outbound">Outbound</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea
        autoFocus
        rows={3}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="What happened?"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || !summary.trim()}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Log
        </Button>
      </div>
    </form>
  );
}
