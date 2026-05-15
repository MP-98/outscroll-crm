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
import { campaignSchema, type CampaignInput } from "@/lib/validations/campaign";
import { createCampaign, updateCampaign } from "@/server/actions/campaigns";

type FormValues = z.input<typeof campaignSchema>;

interface Option {
  id: string;
  label: string;
}

interface Props {
  campaignId?: string;
  initial?: Partial<FormValues>;
  managedBrands: Option[];
  managers: Option[];
  currentUserId: string;
  defaultManagedBrandId?: string;
  onDone?: () => void;
}

export function CampaignForm({
  campaignId,
  initial,
  managedBrands,
  managers,
  currentUserId,
  defaultManagedBrandId,
  onDone,
}: Props) {
  const [pending, start] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(campaignSchema) as never,
    defaultValues: {
      managed_brand_id: defaultManagedBrandId ?? "",
      name: "",
      brief: null,
      budget: null,
      deliverable_target: null,
      starts_on: null,
      ends_on: null,
      status: "planning",
      owner_id: currentUserId,
      notes: null,
      ...initial,
    } as FormValues,
  });

  function onSubmit(data: FormValues) {
    start(async () => {
      try {
        const parsed = campaignSchema.parse(data) as CampaignInput;
        if (campaignId) {
          await updateCampaign(campaignId, parsed);
          toast.success("Campaign updated");
        } else {
          await createCampaign(parsed);
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
          <Label>Managed brand *</Label>
          <Select
            value={form.watch("managed_brand_id") || ""}
            onValueChange={(v) => form.setValue("managed_brand_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick brand" />
            </SelectTrigger>
            <SelectContent>
              {managedBrands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.managed_brand_id ? (
            <p className="text-[11px] text-destructive">
              {form.formState.errors.managed_brand_id.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="e.g. Summer launch — June"
            {...form.register("name")}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budget">Budget (₹)</Label>
          <Input
            id="budget"
            type="number"
            {...form.register("budget", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deliverable_target">Deliverable target</Label>
          <Input
            id="deliverable_target"
            placeholder="e.g. 30 reels, 50K total reach"
            {...form.register("deliverable_target")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="starts_on">Starts on</Label>
          <Input
            id="starts_on"
            type="date"
            {...form.register("starts_on")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ends_on">Ends on</Label>
          <Input id="ends_on" type="date" {...form.register("ends_on")} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(v) => form.setValue("status", v as FormValues["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="wrapping">Wrapping</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Owner</Label>
          <Select
            value={form.watch("owner_id") ?? currentUserId}
            onValueChange={(v) => form.setValue("owner_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick owner" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                  {m.id === currentUserId ? " (you)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="brief">Brief</Label>
        <Textarea
          id="brief"
          rows={5}
          placeholder="What the brand wants from this campaign — tone, do's and don'ts, hashtags, deadlines."
          {...form.register("brief")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea id="notes" rows={3} {...form.register("notes")} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {campaignId ? "Save changes" : "Create campaign"}
      </Button>
    </form>
  );
}
