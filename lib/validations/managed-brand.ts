import { z } from "zod";
import { normalizeIgHandle } from "@/lib/ig";
import {
  optionalDateSchema,
  optionalIntSchema,
  optionalStringSchema,
} from "./common";

export const managedBrandStatusEnum = z.enum(["active", "paused", "churned"]);

export const managedBrandSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  industry: optionalStringSchema.nullable().default(null),
  ig_handle: z.preprocess(
    (v) => {
      if (v == null) return null;
      const norm = normalizeIgHandle(String(v));
      return norm || null;
    },
    z.union([z.string(), z.null()]),
  ),
  website: optionalStringSchema.nullable().default(null),
  monthly_retainer: optionalIntSchema.nullable().default(null),
  status: managedBrandStatusEnum.default("active"),
  primary_contact_name: optionalStringSchema.nullable().default(null),
  primary_contact_email: optionalStringSchema.nullable().default(null),
  primary_contact_phone: optionalStringSchema.nullable().default(null),
  notes: optionalStringSchema.nullable().default(null),
  onboarded_at: optionalDateSchema.nullable().default(null),
});

export type ManagedBrandInput = z.infer<typeof managedBrandSchema>;
