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
import { TagInput } from "@/components/tag-input";
import {
  externalInfluencerSchema,
  type ExternalInfluencerInput,
} from "@/lib/validations/external-influencer";
import {
  createInfluencer,
  updateInfluencer,
} from "@/server/actions/influencers";

type FormValues = z.input<typeof externalInfluencerSchema>;

interface Props {
  influencerId?: string;
  initial?: Partial<FormValues>;
  niches: string[];
  onDone?: () => void;
}

export function InfluencerForm({ influencerId, initial, niches, onDone }: Props) {
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
      notes: null,
      tags: [],
      ...initial,
    } as FormValues,
  });

  function onSubmit(data: FormValues) {
    start(async () => {
      try {
        const parsed = externalInfluencerSchema.parse(data) as ExternalInfluencerInput;
        if (influencerId) {
          await updateInfluencer(influencerId, parsed);
          toast.success("Influencer updated");
        } else {
          await createInfluencer(parsed);
        }
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
          Rate card (₹)
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rate_reel">Reel</Label>
            <Input
              id="rate_reel"
              type="number"
              {...form.register("rate_reel", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rate_story">Story</Label>
            <Input
              id="rate_story"
              type="number"
              {...form.register("rate_story", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rate_post">Post</Label>
            <Input
              id="rate_post"
              type="number"
              {...form.register("rate_post", { valueAsNumber: true })}
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
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {influencerId ? "Save changes" : "Create influencer"}
      </Button>
    </form>
  );
}
