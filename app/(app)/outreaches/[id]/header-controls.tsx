"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelIcon } from "@/components/channel-icon";
import { updateOutreach } from "@/server/actions/outreaches";
import type { Channel } from "@/lib/supabase/types";

const CHANNELS: Channel[] = ["ig_dm", "linkedin", "whatsapp", "email", "call", "other"];
const CHANNEL_LABEL: Record<Channel, string> = {
  ig_dm: "Instagram DM",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  email: "Email",
  call: "Call",
  other: "Other",
};

export function ChannelSelect({
  outreachId,
  channel,
}: {
  outreachId: string;
  channel: Channel;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Select
      value={channel}
      onValueChange={(v) => {
        start(async () => {
          try {
            await updateOutreach(outreachId, { channel: v as Channel });
            toast.success("Channel updated");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          }
        });
      }}
    >
      <SelectTrigger
        className="h-7 w-auto gap-1.5 border-none bg-transparent px-1.5 text-xs text-muted-foreground shadow-none hover:bg-accent"
        disabled={pending}
      >
        <ChannelIcon channel={channel} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CHANNELS.map((c) => (
          <SelectItem key={c} value={c}>
            {CHANNEL_LABEL[c]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function OwnerSelect({
  outreachId,
  ownerId,
  members,
}: {
  outreachId: string;
  ownerId: string | null;
  members: Array<{ id: string; name: string }>;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Select
      value={ownerId ?? "none"}
      onValueChange={(v) => {
        const next = v === "none" ? null : v;
        start(async () => {
          try {
            await updateOutreach(outreachId, { owner_id: next });
            toast.success("Owner updated");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          }
        });
      }}
    >
      <SelectTrigger
        className="h-7 w-auto gap-1.5 border-none bg-transparent px-1.5 text-xs text-muted-foreground shadow-none hover:bg-accent"
        disabled={pending}
      >
        <span className="text-muted-foreground">Owner:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Unassigned</SelectItem>
        {members.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
