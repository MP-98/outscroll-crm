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
import {
  managedBrandSchema,
  type ManagedBrandInput,
} from "@/lib/validations/managed-brand";
import {
  createManagedBrand,
  updateManagedBrand,
} from "@/server/actions/managed-brands";

type FormValues = z.input<typeof managedBrandSchema>;

interface Props {
  brandId?: string;
  initial?: Partial<FormValues>;
  onDone?: () => void;
}

export function ManagedBrandForm({ brandId, initial, onDone }: Props) {
  const [pending, start] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(managedBrandSchema) as never,
    defaultValues: {
      name: "",
      industry: null,
      ig_handle: null,
      website: null,
      monthly_retainer: null,
      status: "active",
      primary_contact_name: null,
      primary_contact_email: null,
      primary_contact_phone: null,
      notes: null,
      onboarded_at: null,
      ...initial,
    } as FormValues,
  });

  function onSubmit(data: FormValues) {
    start(async () => {
      try {
        const parsed = managedBrandSchema.parse(data) as ManagedBrandInput;
        if (brandId) {
          await updateManagedBrand(brandId, parsed);
          toast.success("Managed brand updated");
        } else {
          await createManagedBrand(parsed);
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
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...form.register("name")} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" {...form.register("industry")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ig_handle">IG handle</Label>
          <Input
            id="ig_handle"
            placeholder="brandhandle"
            {...form.register("ig_handle")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" placeholder="https://…" {...form.register("website")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="monthly_retainer">Monthly retainer (₹)</Label>
          <Input
            id="monthly_retainer"
            type="number"
            {...form.register("monthly_retainer", { valueAsNumber: true })}
          />
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="churned">Churned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboarded_at">Onboarded</Label>
          <Input
            id="onboarded_at"
            type="date"
            {...form.register("onboarded_at")}
          />
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Primary contact
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pc_name">Name</Label>
            <Input id="pc_name" {...form.register("primary_contact_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pc_email">Email</Label>
            <Input
              id="pc_email"
              type="email"
              {...form.register("primary_contact_email")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pc_phone">Phone</Label>
            <Input id="pc_phone" {...form.register("primary_contact_phone")} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...form.register("notes")} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {brandId ? "Save changes" : "Create managed brand"}
      </Button>
    </form>
  );
}
