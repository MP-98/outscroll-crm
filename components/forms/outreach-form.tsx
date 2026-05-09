"use client";

import { useEffect, useTransition } from "react";
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
import { outreachSchema, type OutreachInput } from "@/lib/validations/outreach";
import { createOutreach } from "@/server/actions/outreaches";
import { todayISO } from "@/lib/date";

type OutreachFormValues = z.input<typeof outreachSchema>;

interface Option {
  id: string;
  label: string;
}

interface OutreachFormProps {
  talents: Option[];
  brands: Option[];
  managers: Option[];
  defaultTalentId?: string;
  defaultBrandId?: string;
  onDone?: () => void;
}

export function OutreachForm({
  talents,
  brands,
  managers,
  defaultTalentId,
  defaultBrandId,
  onDone,
}: OutreachFormProps) {
  const [pending, start] = useTransition();
  const form = useForm<OutreachFormValues>({
    resolver: zodResolver(outreachSchema) as never,
    defaultValues: {
      talent_id: defaultTalentId ?? "",
      brand_id: defaultBrandId ?? "",
      primary_poc_id: null,
      channel: "ig_dm",
      status: "prospected",
      deliverables: null,
      proposed_amount: null,
      agreed_amount: null,
      commission_pct: null,
      next_followup_at: todayISO(),
      owner_id: null,
      notes: null,
      tags: [],
      lost_reason: null,
      paid_at: null,
    } as OutreachFormValues,
  });

  // Default follow-up to today
  useEffect(() => {
    if (!form.getValues("next_followup_at")) {
      form.setValue("next_followup_at", todayISO());
    }
  }, [form]);

  function onSubmit(data: OutreachFormValues) {
    start(async () => {
      try {
        const parsed = outreachSchema.parse(data) as OutreachInput;
        await createOutreach(parsed);
        onDone?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit((d) => onSubmit(d as OutreachFormValues))} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Talent *</Label>
          <Select
            value={form.watch("talent_id") || ""}
            onValueChange={(v) => form.setValue("talent_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick talent" />
            </SelectTrigger>
            <SelectContent>
              {talents.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.talent_id ? (
            <p className="text-[11px] text-destructive">{form.formState.errors.talent_id.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label>Brand *</Label>
          <Select
            value={form.watch("brand_id") || ""}
            onValueChange={(v) => form.setValue("brand_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.brand_id ? (
            <p className="text-[11px] text-destructive">{form.formState.errors.brand_id.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label>Channel</Label>
          <Select
            value={form.watch("channel")}
            onValueChange={(v) => form.setValue("channel", v as OutreachFormValues["channel"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ig_dm">Instagram DM</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Stage</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(v) => form.setValue("status", v as OutreachFormValues["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prospected">Prospected</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="in_conversation">In conversation</SelectItem>
              <SelectItem value="brief_received">Brief received</SelectItem>
              <SelectItem value="negotiating">Negotiating</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="live">Live</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="next_followup_at">Next follow-up *</Label>
          <Input
            id="next_followup_at"
            type="date"
            required
            {...form.register("next_followup_at")}
          />
          {form.formState.errors.next_followup_at ? (
            <p className="text-[11px] text-destructive">
              {form.formState.errors.next_followup_at.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label>Owner</Label>
          <Select
            value={form.watch("owner_id") ?? "self"}
            onValueChange={(v) => form.setValue("owner_id", v === "self" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self">Me</SelectItem>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proposed_amount">Proposed (₹)</Label>
          <Input
            id="proposed_amount"
            type="number"
            {...form.register("proposed_amount", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agreed_amount">Agreed (₹)</Label>
          <Input
            id="agreed_amount"
            type="number"
            {...form.register("agreed_amount", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="commission_pct">Commission %</Label>
          <Input
            id="commission_pct"
            type="number"
            step="0.5"
            {...form.register("commission_pct", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deliverables">Deliverables</Label>
        <Textarea id="deliverables" rows={2} {...form.register("deliverables")} />
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
        Create outreach
      </Button>
    </form>
  );
}
