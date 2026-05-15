"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Snail, Check, Inbox as InboxIcon, Clock, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChannelIcon } from "@/components/channel-icon";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { CloseOutreachMenu } from "@/components/close-outreach-menu";
import { fmtDate, fmtRelative } from "@/lib/date";
import { snoozeOutreach, transitionStatus } from "@/server/actions/outreaches";
import {
  snoozeCampaignOutreach,
  transitionCampaignOutreachStatus,
} from "@/server/actions/campaign-outreaches";
import { addDays } from "date-fns";

export interface InboxItem {
  id: string;
  source: "outreach" | "campaign";
  /** Talent name (talent side) or influencer/talent name (campaign side). */
  who_name: string;
  /** Brand name (talent side) or campaign name (campaign side). */
  ref_name: string;
  channel: string;
  status: string;
  next_followup_at: string;
  owner_id: string | null;
  last_activity: string | null;
}

export function InboxView({
  items,
  today,
  myUserId,
}: {
  items: InboxItem[];
  today: string;
  myUserId: string;
}) {
  const [mineOnly, setMineOnly] = useState(true);
  const [side, setSide] = useState<"all" | "talent" | "campaign">("all");

  const filtered = items
    .filter((i) => (mineOnly ? i.owner_id === myUserId : true))
    .filter((i) => {
      if (side === "all") return true;
      if (side === "talent") return i.source === "outreach";
      return i.source === "campaign";
    });

  const due = filtered.filter((i) => i.next_followup_at === today);
  const overdue = filtered.filter((i) => i.next_followup_at < today);
  const upcoming = filtered.filter((i) => i.next_followup_at > today);

  return (
    <div className="px-5 py-4 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant={mineOnly ? "default" : "outline"}
          onClick={() => setMineOnly(true)}
        >
          Assigned to me
        </Button>
        <Button
          size="sm"
          variant={mineOnly ? "outline" : "default"}
          onClick={() => setMineOnly(false)}
        >
          All team
        </Button>
        <div className="ml-2 inline-flex rounded-md border border-border bg-muted/30 p-0.5">
          <Button
            type="button"
            variant={side === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSide("all")}
          >
            All
          </Button>
          <Button
            type="button"
            variant={side === "talent" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSide("talent")}
          >
            Talent
          </Button>
          <Button
            type="button"
            variant={side === "campaign" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSide("campaign")}
          >
            Campaign
          </Button>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} item{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<InboxIcon />}
          title="Inbox zero"
          description="You're all caught up on follow-ups."
        />
      ) : null}

      {overdue.length > 0 ? (
        <Section
          title="Overdue"
          icon={<AlertCircle className="text-destructive" />}
          count={overdue.length}
        >
          {overdue.map((i) => (
            <InboxRow key={`${i.source}-${i.id}`} item={i} variant="overdue" />
          ))}
        </Section>
      ) : null}

      {due.length > 0 ? (
        <Section
          title="Due today"
          icon={<Clock className="text-amber-500" />}
          count={due.length}
        >
          {due.map((i) => (
            <InboxRow key={`${i.source}-${i.id}`} item={i} variant="due" />
          ))}
        </Section>
      ) : null}

      {upcoming.length > 0 ? (
        <Section
          title="Upcoming this week"
          icon={<Calendar className="text-muted-foreground" />}
          count={upcoming.length}
        >
          {upcoming.map((i) => (
            <InboxRow key={`${i.source}-${i.id}`} item={i} variant="upcoming" />
          ))}
        </Section>
      ) : null}
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
          {title}
          <Badge variant="outline">{count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">{children}</ul>
      </CardContent>
    </Card>
  );
}

function InboxRow({
  item,
  variant,
}: {
  item: InboxItem;
  variant: "overdue" | "due" | "upcoming";
}) {
  const [, start] = useTransition();
  const router = useRouter();

  const href =
    item.source === "campaign"
      ? `/campaign-outreaches/${item.id}`
      : `/outreaches/${item.id}`;

  function onSnooze() {
    const next = addDays(new Date(item.next_followup_at), 3).toISOString().slice(0, 10);
    start(async () => {
      try {
        if (item.source === "campaign") {
          await snoozeCampaignOutreach(item.id, next);
        } else {
          await snoozeOutreach(item.id, next);
        }
        toast.success("Snoozed");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function onMarkPaid() {
    start(async () => {
      try {
        if (item.source === "campaign") {
          await transitionCampaignOutreachStatus(item.id, "paid");
        } else {
          await transitionStatus(item.id, "paid");
        }
        toast.success("Marked paid");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <li className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent">
      <ChannelIcon channel={item.channel} />
      <div className="min-w-0 flex-1">
        <Link href={href} className="font-medium hover:text-primary">
          {item.who_name}
        </Link>
        <span className="text-muted-foreground"> ↔ </span>
        <span className="text-foreground">{item.ref_name}</span>
        {item.source === "campaign" ? (
          <Badge variant="outline" className="ml-1.5 text-[10px]">
            Campaign
          </Badge>
        ) : null}
        <div className="text-xs text-muted-foreground mt-0.5">
          Last activity {fmtRelative(item.last_activity)}
        </div>
      </div>
      <StatusPill status={item.status as never} />
      <span
        className={`text-xs tabular-nums ${
          variant === "overdue"
            ? "text-destructive"
            : variant === "due"
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
        }`}
      >
        {fmtDate(item.next_followup_at)}
      </span>
      <button
        title="Snooze 3 days"
        onClick={onSnooze}
        className="text-muted-foreground hover:text-foreground"
      >
        <Snail className="h-3.5 w-3.5" />
      </button>
      <button
        title="Mark paid"
        onClick={onMarkPaid}
        className="text-muted-foreground hover:text-success"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <CloseOutreachMenu id={item.id} source={item.source} />
    </li>
  );
}
