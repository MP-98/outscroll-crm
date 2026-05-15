import { z } from "zod";
import {
  optionalDateSchema,
  optionalIntSchema,
  optionalStringSchema,
} from "./common";

export const campaignStatusEnum = z.enum([
  "planning",
  "live",
  "wrapping",
  "done",
  "cancelled",
]);

export const campaignSchema = z.object({
  managed_brand_id: z.string().uuid({ message: "Required" }),
  name: z.string().trim().min(1, "Required"),
  brief: optionalStringSchema.nullable().default(null),
  budget: optionalIntSchema.nullable().default(null),
  deliverable_target: optionalStringSchema.nullable().default(null),
  starts_on: optionalDateSchema.nullable().default(null),
  ends_on: optionalDateSchema.nullable().default(null),
  status: campaignStatusEnum.default("planning"),
  owner_id: z.string().uuid().nullable().optional(),
  notes: optionalStringSchema.nullable().default(null),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
