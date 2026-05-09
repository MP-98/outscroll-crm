import {
  AtSign,
  BriefcaseBusiness,
  MessageCircle,
  Mail,
  Phone,
  StickyNote,
  ArrowUpDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityChannel } from "@/lib/supabase/types";

const ICONS: Record<string, LucideIcon> = {
  ig_dm: AtSign,
  ig_link: AtSign,
  linkedin: BriefcaseBusiness,
  whatsapp: MessageCircle,
  email: Mail,
  call: Phone,
  phone: Phone,
  note: StickyNote,
  status_change: ArrowUpDown,
  other: StickyNote,
};

export function ChannelIcon({
  channel,
  className,
}: {
  channel: ActivityChannel | string;
  className?: string;
}) {
  const Icon = ICONS[channel] ?? StickyNote;
  return <Icon className={cn("h-3.5 w-3.5 text-muted-foreground", className)} />;
}

export function ChannelLabel(channel: string): string {
  switch (channel) {
    case "ig_dm":
      return "Instagram DM";
    case "ig_link":
      return "Instagram link";
    case "linkedin":
      return "LinkedIn";
    case "whatsapp":
      return "WhatsApp";
    case "email":
      return "Email";
    case "call":
      return "Call";
    case "phone":
      return "Phone";
    case "note":
      return "Note";
    case "status_change":
      return "Status change";
    default:
      return "Other";
  }
}
