"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCompact, formatINR } from "@/lib/currency";
import { bulkAddToCampaign } from "@/server/actions/campaign-outreaches";

export interface PoolInfluencer {
  id: string;
  full_name: string | null;
  ig_handle: string;
  ig_followers: string | null;
  avg_reel_views: string | null;
  niches: string[];
  city: string | null;
  rate_reel: string | null;
}

export interface PoolTalent {
  id: string;
  full_name: string;
  ig_handle: string;
  ig_followers: number | null;
  avg_reel_views: number | null;
  niches: string[];
  city: string | null;
  rate_reel: number | null;
}

interface Props {
  campaignId: string;
  influencers: PoolInfluencer[];
  talents: PoolTalent[];
  alreadyAdded: {
    external: Set<string>;
    talent: Set<string>;
  };
}

type Pick = { kind: "external"; id: string } | { kind: "talent"; id: string };

export function AddInfluencersDialog({
  campaignId,
  influencers,
  talents,
  alreadyAdded,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"external" | "talent">("external");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Pick[]>([]);
  const [pending, start] = useTransition();

  const filteredExternal = useMemo(() => {
    const q = query.trim().toLowerCase();
    return influencers
      .filter((i) => !alreadyAdded.external.has(i.id))
      .filter((i) => {
        if (!q) return true;
        return (
          (i.full_name?.toLowerCase().includes(q) ?? false) ||
          i.ig_handle.toLowerCase().includes(q) ||
          i.niches.some((n) => n.toLowerCase().includes(q))
        );
      });
  }, [influencers, query, alreadyAdded.external]);

  const filteredTalents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return talents
      .filter((t) => !alreadyAdded.talent.has(t.id))
      .filter((t) => {
        if (!q) return true;
        return (
          t.full_name.toLowerCase().includes(q) ||
          t.ig_handle.toLowerCase().includes(q) ||
          t.niches.some((n) => n.toLowerCase().includes(q))
        );
      });
  }, [talents, query, alreadyAdded.talent]);

  function isPicked(kind: "external" | "talent", id: string) {
    return selected.some((s) => s.kind === kind && s.id === id);
  }

  function toggle(kind: "external" | "talent", id: string) {
    setSelected((prev) =>
      prev.some((p) => p.kind === kind && p.id === id)
        ? prev.filter((p) => !(p.kind === kind && p.id === id))
        : [...prev, { kind, id }],
    );
  }

  function submit() {
    if (selected.length === 0) return;
    start(async () => {
      try {
        const result = await bulkAddToCampaign(campaignId, selected);
        toast.success(`Shortlisted ${result.added}`);
        setSelected([]);
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus />
        Add influencers
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle>Add influencers to this campaign</DialogTitle>
            <DialogDescription>
              Pick from the external pool or your talent roster. Selected rows
              are shortlisted in this campaign.
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "external" | "talent")}
          >
            <div className="px-6">
              <TabsList>
                <TabsTrigger value="external">
                  External pool ({filteredExternal.length})
                </TabsTrigger>
                <TabsTrigger value="talent">
                  Talents ({filteredTalents.length})
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="px-6 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search name, handle, niche…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>

            <TabsContent value="external" className="mt-0">
              <PoolList
                kind="external"
                rows={filteredExternal.map((i) => ({
                  id: i.id,
                  name: i.full_name ?? `@${i.ig_handle}`,
                  handle: i.ig_handle,
                  followers: i.ig_followers,
                  avgReels: i.avg_reel_views,
                  niches: i.niches,
                  city: i.city,
                  rateReel: i.rate_reel,
                }))}
                isPicked={(id) => isPicked("external", id)}
                onToggle={(id) => toggle("external", id)}
              />
            </TabsContent>
            <TabsContent value="talent" className="mt-0">
              <PoolList
                kind="talent"
                rows={filteredTalents.map((t) => ({
                  id: t.id,
                  name: t.full_name,
                  handle: t.ig_handle,
                  // Talents keep numeric metrics — format for display here.
                  followers: t.ig_followers != null ? formatCompact(t.ig_followers) : null,
                  avgReels: t.avg_reel_views != null ? formatCompact(t.avg_reel_views) : null,
                  niches: t.niches,
                  city: t.city,
                  rateReel: t.rate_reel != null ? formatINR(t.rate_reel) : null,
                }))}
                isPicked={(id) => isPicked("talent", id)}
                onToggle={(id) => toggle("talent", id)}
              />
            </TabsContent>
          </Tabs>
          <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {selected.length} selected
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={submit}
                disabled={pending || selected.length === 0}
              >
                {pending ? <Loader2 className="animate-spin" /> : <Plus />}
                Shortlist {selected.length || ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface PoolRow {
  id: string;
  name: string;
  handle: string;
  /** Pre-formatted display strings (externals are free-text, talents formatted). */
  followers: string | null;
  avgReels: string | null;
  niches: string[];
  city: string | null;
  rateReel: string | null;
}

function PoolList({
  kind: _kind,
  rows,
  isPicked,
  onToggle,
}: {
  kind: "external" | "talent";
  rows: PoolRow[];
  isPicked: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  void _kind;
  if (rows.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-xs text-muted-foreground">
        No matches. Try a different search term or add to the pool first.
      </p>
    );
  }
  return (
    <ul className="max-h-80 overflow-y-auto divide-y divide-border">
      {rows.map((r) => {
        const picked = isPicked(r.id);
        return (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onToggle(r.id)}
              className={cn(
                "w-full text-left px-6 py-2.5 hover:bg-accent transition-colors",
                picked && "bg-primary/5",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-4 w-4 shrink-0 rounded border flex items-center justify-center",
                    picked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {picked ? <Check className="h-3 w-3" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{r.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      @{r.handle}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                    {r.followers ? <span>{r.followers} followers</span> : null}
                    {r.avgReels ? <span>{r.avgReels} avg reels</span> : null}
                    {r.city ? <span>{r.city}</span> : null}
                    {r.rateReel ? <span>reel {r.rateReel}</span> : null}
                  </div>
                </div>
                <div className="hidden sm:flex flex-wrap gap-1 max-w-[10rem] justify-end">
                  {r.niches.slice(0, 2).map((n) => (
                    <Badge key={n} className="text-[10px]">
                      {n}
                    </Badge>
                  ))}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
