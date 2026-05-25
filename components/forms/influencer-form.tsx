"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/tag-input";
import {
  externalInfluencerSchema,
  TONE_TAGS,
  type ExternalInfluencerInput,
} from "@/lib/validations/external-influencer";
import {
  createInfluencer,
  updateInfluencer,
} from "@/server/actions/influencers";
import { cn } from "@/lib/utils";

type FormValues = z.input<typeof externalInfluencerSchema>;

const TONE_TAG_SET = TONE_TAGS as readonly string[];

interface Props {
  influencerId?: string;
  initial?: Partial<FormValues>;
  niches: string[];
  /** All tags currently in use across the influencer pool — used to autocomplete the Tags input. */
  existingTags?: string[];
  onDone?: () => void;
}

export function InfluencerForm({
  influencerId,
  initial,
  niches,
  existingTags = [],
  onDone,
}: Props) {
  const [pending, start] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(externalInfluencerSchema) as never,
    defaultValues: {
      full_name: null,
      ig_handle: "",
      ig_followers: null,
      avg_reel_views: null,
      niches: [],
      city: null,
      contact_email: null,
      contact_phone: null,
      rate_reel: null,
      rate_story: null,
      rate_post: null,
      rate_reel_non_collab: null,
      ad_rights: null,
      is_managed: null,
      managed_by: null,
      notes: null,
      tags: [],
      content_pov: null,
      format_mix: null,
      languages: [],
      tone_tags: [],
      production_quality: null,
      audience_age_band_est: null,
      brand_collabs_visible: null,
      red_flags: null,
      casting_notes: null,
      events_other: null,
      analysis_depth: "not_analyzed",
      last_analyzed_at: null,
      analyzed_by: null,
      ...initial,
    } as FormValues,
  });

  const toneTags = (form.watch("tone_tags") ?? []) as string[];
  function toggleTone(tag: string) {
    const next = toneTags.includes(tag)
      ? toneTags.filter((t) => t !== tag)
      : [...toneTags, tag];
    form.setValue("tone_tags", next as FormValues["tone_tags"]);
  }

  function onSubmit(data: FormValues) {
    start(async () => {
      try {
        const parsed = externalInfluencerSchema.parse(data) as ExternalInfluencerInput;
        const result = influencerId
          ? await updateInfluencer(influencerId, parsed)
          : await createInfluencer(parsed);
        // On create success the action redirects (never returns here).
        if (result && "error" in result && result.error) {
          toast.error(result.error);
          return;
        }
        if (influencerId) toast.success("Influencer updated");
        onDone?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit((d) => onSubmit(d as FormValues))}
      className="space-y-5 max-w-2xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Name</Label>
          <Input id="full_name" {...form.register("full_name")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ig_handle">IG handle *</Label>
          <Input
            id="ig_handle"
            placeholder="username (without @)"
            {...form.register("ig_handle")}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ig_followers">Followers</Label>
          <Input
            id="ig_followers"
            type="number"
            {...form.register("ig_followers", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="avg_reel_views">Avg reel views</Label>
          <Input
            id="avg_reel_views"
            type="number"
            {...form.register("avg_reel_views", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Niches</Label>
          <TagInput
            value={form.watch("niches") ?? []}
            onChange={(v) => form.setValue("niches", v)}
            suggestions={niches}
            placeholder="Pick or create…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...form.register("city")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact_email">Email</Label>
          <Input
            id="contact_email"
            type="email"
            {...form.register("contact_email")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact_phone">Phone</Label>
          <Input id="contact_phone" {...form.register("contact_phone")} />
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Rate card
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Free-form text — write whatever feels right (&ldquo;20k&rdquo;, &ldquo;₹2.5k&rdquo;, &ldquo;2k–3k&rdquo;).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rate_reel">Reel (collab)</Label>
            <Input
              id="rate_reel"
              placeholder="e.g. 20k"
              {...form.register("rate_reel")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rate_reel_non_collab">Reel (non-collab)</Label>
            <Input
              id="rate_reel_non_collab"
              placeholder="e.g. 35k"
              {...form.register("rate_reel_non_collab")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rate_story">Story</Label>
            <Input
              id="rate_story"
              placeholder="e.g. 5k"
              {...form.register("rate_story")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rate_post">Post</Label>
            <Input
              id="rate_post"
              placeholder="e.g. 10k"
              {...form.register("rate_post")}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ad_rights">Ad rights</Label>
            <Input
              id="ad_rights"
              placeholder="e.g. 30 days organic + 7 days paid, +20% for usage"
              {...form.register("ad_rights")}
            />
          </div>
        </div>
      </div>

      {/* Management */}
      <div className="space-y-3 pt-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Management
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Are they being managed by someone?</Label>
            <Select
              value={
                form.watch("is_managed") === true
                  ? "yes"
                  : form.watch("is_managed") === false
                    ? "no"
                    : "unknown"
              }
              onValueChange={(v) =>
                form.setValue(
                  "is_managed",
                  v === "yes" ? true : v === "no" ? false : null,
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="managed_by">Managed by</Label>
            <Input
              id="managed_by"
              placeholder="Agency / manager name (if known)"
              {...form.register("managed_by")}
              disabled={form.watch("is_managed") === false}
            />
          </div>
        </div>
      </div>

      {/* Content profile */}
      <div className="space-y-3 pt-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Content profile
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="content_pov">Content POV</Label>
          <Input
            id="content_pov"
            placeholder="e.g. budget fashion hauls for college students"
            {...form.register("content_pov")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Format mix</Label>
            <Select
              value={(form.watch("format_mix") as string | null) ?? "none"}
              onValueChange={(v) =>
                form.setValue("format_mix", (v === "none" ? null : v) as FormValues["format_mix"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="reel_heavy">Reel-heavy</SelectItem>
                <SelectItem value="photo_heavy">Photo-heavy</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Production quality</Label>
            <Select
              value={(form.watch("production_quality") as string | null) ?? "none"}
              onValueChange={(v) =>
                form.setValue(
                  "production_quality",
                  (v === "none" ? null : v) as FormValues["production_quality"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="high">High (DSLR / agency)</SelectItem>
                <SelectItem value="mid">Mid (good phone)</SelectItem>
                <SelectItem value="low">Low (raw phone)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Audience age band (est.)</Label>
            <Select
              value={(form.watch("audience_age_band_est") as string | null) ?? "none"}
              onValueChange={(v) =>
                form.setValue(
                  "audience_age_band_est",
                  (v === "none" ? null : v) as FormValues["audience_age_band_est"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="18-24">18–24</SelectItem>
                <SelectItem value="25-34">25–34</SelectItem>
                <SelectItem value="35-44">35–44</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Languages</Label>
          <TagInput
            value={(form.watch("languages") ?? []) as string[]}
            onChange={(v) => form.setValue("languages", v)}
            placeholder="Add and press Enter…"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tone tags</Label>
          <div className="flex flex-wrap gap-1.5">
            {TONE_TAG_SET.map((tag) => {
              const on = toneTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTone(tag)}
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs capitalize transition-colors",
                    on
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Collabs & flags */}
      <div className="space-y-3 pt-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Collabs & flags
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand_collabs_visible">Brand collabs visible</Label>
          <Textarea
            id="brand_collabs_visible"
            rows={2}
            placeholder="Comma-separated brands seen in recent content"
            {...form.register("brand_collabs_visible")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="red_flags">Red flags</Label>
          <Textarea
            id="red_flags"
            rows={2}
            placeholder="Fake engagement, controversy, dropping reach, audience mismatch…"
            {...form.register("red_flags")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="events_other">Event tags</Label>
          <Input
            id="events_other"
            placeholder="e.g. Pinkathon, Mumbai Marathon, fashion weeks"
            {...form.register("events_other")}
          />
        </div>
      </div>

      {/* Casting notes */}
      <div className="space-y-1.5">
        <Label htmlFor="casting_notes">Casting notes</Label>
        <Textarea
          id="casting_notes"
          rows={5}
          placeholder="Free-form analyst notes — the real signal for pitching. Who they're a fit for, hooks, caveats…"
          {...form.register("casting_notes")}
        />
      </div>

      {/* Analysis workflow */}
      <div className="space-y-3 pt-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Analysis workflow
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Analysis depth</Label>
            <Select
              value={form.watch("analysis_depth") ?? "not_analyzed"}
              onValueChange={(v) =>
                form.setValue("analysis_depth", v as FormValues["analysis_depth"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_analyzed">Not analyzed</SelectItem>
                <SelectItem value="tier_1">Tier 1</SelectItem>
                <SelectItem value="tier_2">Tier 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_analyzed_at">Last analyzed</Label>
            <Input
              id="last_analyzed_at"
              type="date"
              {...form.register("last_analyzed_at")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="analyzed_by">Analyzed by</Label>
            <Input
              id="analyzed_by"
              placeholder="You / intern name / AI"
              {...form.register("analyzed_by")}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...form.register("notes")} />
      </div>
      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagInput
          value={form.watch("tags") ?? []}
          onChange={(v) => form.setValue("tags", v)}
          suggestions={existingTags}
          placeholder="Pick or create…"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {influencerId ? "Save changes" : "Create influencer"}
      </Button>
    </form>
  );
}
