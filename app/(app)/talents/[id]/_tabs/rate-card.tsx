"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateTalent } from "@/server/actions/talents";
import { talentSchema, type TalentInput } from "@/lib/validations/talent";
import type { Talent } from "@/lib/supabase/types";

export function RateCardTab({
  talentId,
  talent,
  managers: _managers,
}: {
  talentId: string;
  talent: Talent;
  managers: Array<{ id: string; name: string }>;
}) {
  void _managers;
  const [pending, start] = useTransition();
  const [rates, setRates] = useState({
    rate_reel: talent.rate_reel,
    rate_story: talent.rate_story,
    rate_post: talent.rate_post,
    rate_integration: talent.rate_integration,
    rate_exclusivity: talent.rate_exclusivity,
    default_commission_pct: talent.default_commission_pct,
  });

  function set<K extends keyof typeof rates>(k: K, v: number | null) {
    setRates((prev) => ({ ...prev, [k]: v }));
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      try {
        const next: TalentInput = talentSchema.parse({
          full_name: talent.full_name,
          ig_handle: talent.ig_handle,
          ig_followers: talent.ig_followers,
          avg_reel_views: talent.avg_reel_views,
          niches: talent.niches ?? [],
          city: talent.city,
          languages: talent.languages ?? [],
          status: talent.status,
          exclusivity: talent.exclusivity,
          onboarded_at: talent.onboarded_at,
          manager_id: talent.manager_id,
          tags: talent.tags ?? [],
          ...rates,
          contacts: [],
        });
        await updateTalent(talentId, next);
        toast.success("Rate card saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-sm">Rate card (₹)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="grid grid-cols-2 gap-3">
          <RateField label="Reel" value={rates.rate_reel} onChange={(v) => set("rate_reel", v)} />
          <RateField label="Story" value={rates.rate_story} onChange={(v) => set("rate_story", v)} />
          <RateField label="Post" value={rates.rate_post} onChange={(v) => set("rate_post", v)} />
          <RateField label="Integration" value={rates.rate_integration} onChange={(v) => set("rate_integration", v)} />
          <RateField label="Exclusivity" value={rates.rate_exclusivity} onChange={(v) => set("rate_exclusivity", v)} />
          <div className="space-y-1.5">
            <Label>Commission %</Label>
            <Input
              type="number"
              step="0.5"
              value={rates.default_commission_pct ?? ""}
              onChange={(e) =>
                set("default_commission_pct", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </div>
          <div className="col-span-2 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Save rate card
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function RateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </div>
  );
}
