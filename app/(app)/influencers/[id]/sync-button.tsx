"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncInfluencerFromInstagram } from "@/server/actions/ig-sync";

export function SyncIgButton({ influencerId }: { influencerId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  function onClick() {
    start(async () => {
      try {
        const result = await syncInfluencerFromInstagram(influencerId);
        toast.success(
          `Synced. ${result.followers ?? "—"} followers · avg ${
            result.avg_reel_views ?? "—"
          } views (${result.reels_sampled} reels)`,
        );
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sync failed");
      }
    });
  }
  return (
    <Button onClick={onClick} disabled={pending} variant="secondary">
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCcw />}
      Sync from Instagram
    </Button>
  );
}
