import { z } from "zod";
import { normalizeIgHandle } from "@/lib/ig";
import {
  optionalDateSchema,
  optionalIntSchema,
  optionalStringSchema,
  tagsSchema,
} from "./common";

export const formatMixEnum = z.enum(["reel_heavy", "photo_heavy", "mixed"]);
export const productionQualityEnum = z.enum(["high", "mid", "low"]);
export const audienceAgeBandEnum = z.enum(["18-24", "25-34", "35-44", "mixed"]);
export const analysisDepthEnum = z.enum(["not_analyzed", "tier_1", "tier_2"]);
export const toneTagEnum = z.enum([
  "motivational",
  "educational",
  "aspirational",
  "warm",
  "funny",
  "raw",
  "premium",
  "technical",
]);

export const TONE_TAGS = toneTagEnum.options;

// Empty string / null → null; otherwise validate against the enum.
function nullableEnum<T extends z.ZodTypeAny>(inner: T) {
  return z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.union([inner, z.null()]),
  );
}

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

  // v5 creator-analysis fields
  content_pov: optionalStringSchema.nullable().default(null),
  format_mix: nullableEnum(formatMixEnum),
  languages: tagsSchema,
  tone_tags: z.array(toneTagEnum).default([]),
  production_quality: nullableEnum(productionQualityEnum),
  audience_age_band_est: nullableEnum(audienceAgeBandEnum),
  brand_collabs_visible: optionalStringSchema.nullable().default(null),
  red_flags: optionalStringSchema.nullable().default(null),
  casting_notes: optionalStringSchema.nullable().default(null),
  events_other: optionalStringSchema.nullable().default(null),
  analysis_depth: analysisDepthEnum.default("not_analyzed"),
  last_analyzed_at: optionalDateSchema.nullable().default(null),
  analyzed_by: optionalStringSchema.nullable().default(null),
});

export type ExternalInfluencerInput = z.infer<typeof externalInfluencerSchema>;
