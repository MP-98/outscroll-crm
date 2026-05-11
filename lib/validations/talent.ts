import { z } from "zod";
import {
  optionalDateSchema,
  optionalDecimalSchema,
  optionalIntSchema,
  optionalStringSchema,
  tagsSchema,
} from "./common";
import { normalizeIgHandle } from "@/lib/ig";

export const talentStatusEnum = z.enum(["active", "paused", "offboarded"]);
export const exclusivityEnum = z.enum(["exclusive", "non_exclusive"]);
export const contactKindEnum = z.enum(["phone", "whatsapp", "ig_link", "ig_dm", "email", "other"]);

export const talentContactSchema = z.object({
  id: z.string().optional(),
  kind: contactKindEnum,
  value: z.string().trim().min(1, "Required"),
  is_primary: z.boolean().default(false),
  label: optionalStringSchema.nullable().default(null),
});

export const talentSchema = z.object({
  full_name: z.string().trim().min(1, "Required"),
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
  languages: tagsSchema,
  status: talentStatusEnum.default("active"),
  exclusivity: exclusivityEnum.default("non_exclusive"),
  onboarded_at: optionalDateSchema.nullable().default(null),
  manager_id: z.string().uuid().nullable().optional(),
  rate_reel: optionalIntSchema.nullable().default(null),
  rate_story: optionalIntSchema.nullable().default(null),
  rate_post: optionalIntSchema.nullable().default(null),
  rate_integration: optionalIntSchema.nullable().default(null),
  rate_exclusivity: optionalIntSchema.nullable().default(null),
  default_commission_pct: optionalDecimalSchema.nullable().default(20),
  tags: tagsSchema,
  contacts: z.array(talentContactSchema).default([]),
});

export type TalentInput = z.infer<typeof talentSchema>;
export type TalentContactInput = z.infer<typeof talentContactSchema>;
