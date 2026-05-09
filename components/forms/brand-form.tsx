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
import { TagInput } from "@/components/tag-input";
import { brandSchema, type BrandInput } from "@/lib/validations/brand";
import { createBrand, updateBrand } from "@/server/actions/brands";

type BrandFormValues = z.input<typeof brandSchema>;

interface BrandFormProps {
  brandId?: string;
  initial?: Partial<BrandFormValues>;
  onDone?: () => void;
}

export function BrandForm({ brandId, initial, onDone }: BrandFormProps) {
  const [pending, start] = useTransition();
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema) as never,
    defaultValues: {
      name: "",
      industry: null,
      ig_handle: null,
      website: null,
      tags: [],
      ...initial,
    },
  });

  function onSubmit(data: BrandFormValues) {
    start(async () => {
      try {
        const parsed = brandSchema.parse(data) as BrandInput;
        if (brandId) {
          await updateBrand(brandId, parsed);
          toast.success("Brand updated");
        } else {
          await createBrand(parsed);
        }
        onDone?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit((d) => onSubmit(d as BrandFormValues))} className="space-y-4 max-w-xl">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...form.register("name")} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" {...form.register("industry")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ig_handle">IG handle</Label>
          <Input id="ig_handle" placeholder="brand_handle" {...form.register("ig_handle")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="website">Website</Label>
        <Input id="website" placeholder="https://…" {...form.register("website")} />
      </div>
      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagInput
          value={form.watch("tags") ?? []}
          onChange={(v) => form.setValue("tags", v)}
          placeholder="Add tag…"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {brandId ? "Save changes" : "Create brand"}
      </Button>
    </form>
  );
}
