"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
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
import { BrandPicker, type BrandOption } from "@/components/forms/brand-picker";
import { PocPicker, type PocOption } from "@/components/forms/poc-picker";
import { outreachSchema, type OutreachInput } from "@/lib/validations/outreach";
import { createOutreach } from "@/server/actions/outreaches";
import { todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";

type OutreachFormValues = z.input<typeof outreachSchema>;

interface Option {
  id: string;
  label: string;
}

interface OutreachFormProps {
  talents: Option[];
  brands: BrandOption[];
  managers: Option[];
  pocs: PocOption[];
  currentUserId: string;
  defaultTalentId?: string;
  defaultBrandId?: string;
  onDone?: () => void;
}

export function OutreachForm({
  talents,
  brands,
  managers,
  pocs,
  currentUserId,
  defaultTalentId,
  defaultBrandId,
  onDone,
}: OutreachFormProps) {
  const [pending, start] = useTransition();
  const [brandList, setBrandList] = useState<BrandOption[]>(brands);
  const [pocList, setPocList] = useState<PocOption[]>(pocs);

  const form = useForm<OutreachFormValues>({
    resolver: zodResolver(outreachSchema) as never,
    defaultValues: {
      talent_id: defaultTalentId ?? "",
      brand_id: defaultBrandId ?? "",
      primary_poc_id: null,
      channel: "ig_dm",
      direction: "outbound",
      status: "prospected",
      deliverables: null,
      proposed_amount: null,
      negotiated_amount: null,
      agreed_amount: null,
      commission_pct: null,
      reached_out_at: todayISO(),
      next_followup_at: todayISO(),
      owner_id: currentUserId,
      notes: null,
      tags: [],
      lost_reason: null,
      paid_at: null,
    } as OutreachFormValues,
  });

  const brandId = form.watch("brand_id");
  const selectedBrand = useMemo(
    () => brandList.find((b) => b.id === brandId) ?? null,
    [brandList, brandId],
  );
  const brandPocs = useMemo(
    () => pocList.filter((p) => p.brand_id === brandId),
    [pocList, brandId],
  );

  // Default follow-up to today and reset POC when brand changes.
  useEffect(() => {
    if (!form.getValues("next_followup_at")) {
      form.setValue("next_followup_at", todayISO());
    }
  }, [form]);

  useEffect(() => {
    const currentPoc = form.getValues("primary_poc_id");
    if (currentPoc && !brandPocs.some((p) => p.id === currentPoc)) {
      form.setValue("primary_poc_id", null);
    }
  }, [brandId, brandPocs, form]);

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

  const direction = form.watch("direction") ?? "outbound";

  return (
    <form
      onSubmit={form.handleSubmit((d) => onSubmit(d as OutreachFormValues))}
      className="space-y-6 max-w-3xl"
    >
      {/* Parties */}
      <Section title="Parties">
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
              <p className="text-[11px] text-destructive">
                {form.formState.errors.talent_id.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Brand *</Label>
            <BrandPicker
              brands={brandList}
              value={brandId || null}
              onChange={(id, brand) => {
                form.setValue("brand_id", id);
                // Keep the local list updated when a brand was just created.
                if (!brandList.some((b) => b.id === id)) {
                  setBrandList((prev) =>
                    [...prev, brand].sort((a, b) => a.name.localeCompare(b.name)),
                  );
                }
              }}
            />
            {selectedBrand?.industry ? (
              <p className="text-[11px] text-muted-foreground">
                Industry: {selectedBrand.industry}
              </p>
            ) : null}
            {form.formState.errors.brand_id ? (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.brand_id.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>POC at brand</Label>
            <PocPicker
              brandId={brandId || null}
              pocs={pocList}
              value={form.watch("primary_poc_id") ?? null}
              onChange={(id) => form.setValue("primary_poc_id", id)}
              onCreated={(poc) =>
                setPocList((prev) =>
                  prev.some((p) => p.id === poc.id) ? prev : [...prev, poc],
                )
              }
            />
            {(() => {
              const pocId = form.watch("primary_poc_id");
              if (!pocId) return null;
              const poc = pocList.find((p) => p.id === pocId);
              if (!poc || (!poc.email && !poc.phone)) return null;
              return (
                <p className="text-[11px] text-muted-foreground">
                  {poc.email ?? ""}
                  {poc.email && poc.phone ? " · " : ""}
                  {poc.phone ?? ""}
                </p>
              );
            })()}
          </div>
        </div>
      </Section>

      {/* Channel + direction + stage */}
      <Section title="Outreach details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Direction</Label>
            <div className="grid grid-cols-2 gap-2">
              <DirectionToggle
                active={direction === "outbound"}
                icon={<ArrowUpRight className="h-3.5 w-3.5" />}
                label="Outbound"
                sub="We reached out"
                onClick={() => form.setValue("direction", "outbound")}
              />
              <DirectionToggle
                active={direction === "inbound"}
                icon={<ArrowDownLeft className="h-3.5 w-3.5" />}
                label="Inbound"
                sub="Brand came to us"
                onClick={() => form.setValue("direction", "inbound")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Platform / channel</Label>
            <Select
              value={form.watch("channel")}
              onValueChange={(v) =>
                form.setValue("channel", v as OutreachFormValues["channel"])
              }
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
              onValueChange={(v) =>
                form.setValue("status", v as OutreachFormValues["status"])
              }
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
      </Section>

      {/* Dates */}
      <Section title="Dates">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reached_out_at">When did we reach out?</Label>
            <Input
              id="reached_out_at"
              type="date"
              {...form.register("reached_out_at")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next_followup_at">Follow-up due *</Label>
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
        </div>
      </Section>

      {/* Deal terms */}
      <Section title="Deal terms">
        <div className="space-y-1.5">
          <Label htmlFor="deliverables">Deliverables</Label>
          <Textarea
            id="deliverables"
            rows={2}
            placeholder="e.g. 2 reels + 1 story over 30 days"
            {...form.register("deliverables")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div className="space-y-1.5">
            <Label htmlFor="proposed_amount">Proposed rate (₹)</Label>
            <Input
              id="proposed_amount"
              type="number"
              placeholder="First quote"
              {...form.register("proposed_amount", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="negotiated_amount">Negotiated rate (₹)</Label>
            <Input
              id="negotiated_amount"
              type="number"
              placeholder="Mid-negotiation"
              {...form.register("negotiated_amount", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agreed_amount">Agreed rate (₹)</Label>
            <Input
              id="agreed_amount"
              type="number"
              placeholder="Final"
              {...form.register("agreed_amount", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="commission_pct">Commission %</Label>
            <Input
              id="commission_pct"
              type="number"
              step="0.5"
              placeholder="Defaults to talent's commission_pct (20%)"
              {...form.register("commission_pct", { valueAsNumber: true })}
              className="max-w-[160px]"
            />
          </div>
        </div>
      </Section>

      {/* Notes & tags */}
      <Section title="Notes">
        <div className="space-y-3">
          <Textarea rows={3} {...form.register("notes")} />
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <TagInput
              value={form.watch("tags") ?? []}
              onChange={(v) => form.setValue("tags", v)}
            />
          </div>
        </div>
      </Section>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Create outreach
      </Button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

function DirectionToggle({
  active,
  icon,
  label,
  sub,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border bg-background hover:bg-accent text-muted-foreground",
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {label}
      </span>
      <span className="text-[11px] text-muted-foreground">{sub}</span>
    </button>
  );
}
