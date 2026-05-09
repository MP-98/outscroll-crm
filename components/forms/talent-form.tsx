"use client";

import { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/tag-input";
import { talentSchema, type TalentInput } from "@/lib/validations/talent";
import { createTalent, updateTalent } from "@/server/actions/talents";

type TalentFormValues = z.input<typeof talentSchema>;

interface ManagerOption {
  id: string;
  name: string;
}

interface TalentFormProps {
  talentId?: string;
  initial?: Partial<TalentFormValues>;
  managers: ManagerOption[];
  niches: string[];
  onDone?: () => void;
}

const DEFAULTS: TalentFormValues = {
  full_name: "",
  ig_handle: "",
  ig_followers: null,
  avg_reel_views: null,
  niches: [],
  city: null,
  languages: [],
  status: "active",
  exclusivity: "non_exclusive",
  onboarded_at: null,
  manager_id: null,
  rate_reel: null,
  rate_story: null,
  rate_post: null,
  rate_integration: null,
  rate_exclusivity: null,
  default_commission_pct: 20,
  tags: [],
  contacts: [],
};

export function TalentForm({ talentId, initial, managers, niches, onDone }: TalentFormProps) {
  const [pending, start] = useTransition();
  const form = useForm<TalentFormValues>({
    resolver: zodResolver(talentSchema) as never,
    defaultValues: { ...DEFAULTS, ...initial } as TalentFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  function onSubmit(data: TalentFormValues) {
    start(async () => {
      try {
        const parsed = talentSchema.parse(data) as TalentInput;
        if (talentId) {
          await updateTalent(talentId, parsed);
          toast.success("Talent updated");
        } else {
          await createTalent(parsed);
        }
        onDone?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit((d) => onSubmit(d as TalentFormValues))} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name *</Label>
          <Input id="full_name" {...form.register("full_name")} required />
          <FieldError msg={form.formState.errors.full_name?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ig_handle">IG handle *</Label>
          <Input id="ig_handle" placeholder="username (without @)" {...form.register("ig_handle")} required />
          <FieldError msg={form.formState.errors.ig_handle?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ig_followers">Followers</Label>
          <Input id="ig_followers" type="number" {...form.register("ig_followers", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="avg_reel_views">Avg reel views</Label>
          <Input id="avg_reel_views" type="number" {...form.register("avg_reel_views", { valueAsNumber: true })} />
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
          <Label>Languages</Label>
          <TagInput
            value={form.watch("languages") ?? []}
            onChange={(v) => form.setValue("languages", v)}
            placeholder="Add and press Enter…"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(v) => form.setValue("status", v as TalentFormValues["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="offboarded">Offboarded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Exclusivity</Label>
          <Select
            value={form.watch("exclusivity")}
            onValueChange={(v) => form.setValue("exclusivity", v as TalentFormValues["exclusivity"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exclusive">Exclusive</SelectItem>
              <SelectItem value="non_exclusive">Non-exclusive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboarded_at">Onboarded</Label>
          <Input id="onboarded_at" type="date" {...form.register("onboarded_at")} />
        </div>
        <div className="space-y-1.5">
          <Label>Manager</Label>
          <Select
            value={form.watch("manager_id") ?? "none"}
            onValueChange={(v) => form.setValue("manager_id", v === "none" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Rate card (₹)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <RateField label="Reel" name="rate_reel" form={form} />
          <RateField label="Story" name="rate_story" form={form} />
          <RateField label="Post" name="rate_post" form={form} />
          <RateField label="Integration" name="rate_integration" form={form} />
          <RateField label="Exclusivity" name="rate_exclusivity" form={form} />
          <div className="space-y-1.5">
            <Label>Commission %</Label>
            <Input
              type="number"
              step="0.5"
              {...form.register("default_commission_pct", { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Contacts
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ kind: "phone", value: "", is_primary: false, label: null })}
          >
            <Plus /> Add contact
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-[140px_1fr_1fr_auto] gap-2 items-end">
              <div>
                <Select
                  value={form.watch(`contacts.${i}.kind`)}
                  onValueChange={(v) =>
                    form.setValue(`contacts.${i}.kind`, v as NonNullable<TalentFormValues["contacts"]>[number]["kind"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="ig_link">IG link</SelectItem>
                    <SelectItem value="ig_dm">IG DM</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Value" {...form.register(`contacts.${i}.value`)} />
              <Input placeholder="Label (optional)" {...form.register(`contacts.${i}.label`)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
          {fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">No contacts yet.</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        <Label>Tags</Label>
        <TagInput
          value={form.watch("tags") ?? []}
          onChange={(v) => form.setValue("tags", v)}
          placeholder="Add tag…"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {talentId ? "Save changes" : "Create talent"}
        </Button>
      </div>
    </form>
  );
}

function RateField({
  label,
  name,
  form,
}: {
  label: string;
  name: keyof TalentFormValues;
  form: ReturnType<typeof useForm<TalentFormValues>>;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        {...form.register(name as Parameters<typeof form.register>[0], {
          valueAsNumber: true,
        })}
      />
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-destructive">{msg}</p>;
}
