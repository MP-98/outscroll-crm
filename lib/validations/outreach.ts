import { z } from "zod";
import {
  optionalDateSchema,
  optionalDecimalSchema,
  optionalIntSchema,
  optionalStringSchema,
  requiredDateSchema,
  tagsSchema,
} from "./common";

export const channelEnum = z.enum(["ig_dm", "linkedin", "whatsapp", "email", "call", "other"]);
export const outreachStatusEnum = z.enum([
  "prospected",
  "contacted",
  "in_conversation",
  "brief_received",
  "negotiating",
  "confirmed",
  "live",
  "paid",
  "lost",
  "on_hold",
]);

export const outreachSchema = z.object({
  talent_id: z.string().uuid({ message: "Required" }),
  brand_id: z.string().uuid({ message: "Required" }),
  primary_poc_id: z.string().uuid().nullable().optional(),
  channel: channelEnum,
  status: outreachStatusEnum.default("prospected"),
  deliverables: optionalStringSchema.nullable().default(null),
  proposed_amount: optionalIntSchema.nullable().default(null),
  agreed_amount: optionalIntSchema.nullable().default(null),
  commission_pct: optionalDecimalSchema.nullable().default(null),
  next_followup_at: requiredDateSchema,
  owner_id: z.string().uuid().nullable().optional(),
  notes: optionalStringSchema.nullable().default(null),
  tags: tagsSchema,
  lost_reason: optionalStringSchema.nullable().default(null),
  paid_at: optionalDateSchema.nullable().default(null),
});

export const activitySchema = z.object({
  outreach_id: z.string().uuid(),
  channel: z.enum(["ig_dm", "linkedin", "whatsapp", "email", "call", "note", "other"]).default("note"),
  direction: z.enum(["outbound", "inbound", "internal"]).nullable().default(null),
  summary: z.string().trim().min(1, "Required"),
  attachment_url: optionalStringSchema.nullable().default(null),
});

export type OutreachInput = z.infer<typeof outreachSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;
