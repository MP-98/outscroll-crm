import { z } from "zod";
import { normalizeIgHandle } from "@/lib/ig";
import {
  optionalIntSchema,
  optionalStringSchema,
  tagsSchema,
} from "./common";

export const externalInfluencerSchema = z.object({
  full_name: optionalStringSchema.nullable().default(null),
  ig_handle: z
    .string()
    .trim()
    .min(1, "Required")
    .transform((v) => normalizeIgHandle(v))
    .refine((v) => v.length > 0, "Required"),
  ig_followers: optionalIntSchema.nullable().default(null),
  avg_reel_views: optionalIntSchema.nullable().default(null),
  niches: tagsSchema,
  city: optionalStringSchema.nullable().default(null),
  contact_email: optionalStringSchema.nullable().default(null),
  contact_phone: optionalStringSchema.nullable().default(null),
  rate_reel: optionalIntSchema.nullable().default(null),
  rate_story: optionalIntSchema.nullable().default(null),
  rate_post: optionalIntSchema.nullable().default(null),
  notes: optionalStringSchema.nullable().default(null),
  tags: tagsSchema,
});

export type ExternalInfluencerInput = z.infer<typeof externalInfluencerSchema>;
