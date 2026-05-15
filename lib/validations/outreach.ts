import { z } from "zod";
import {
  optionalDateSchema,
  optionalDecimalSchema,
  optionalIntSchema,
  optionalStringSchema,
  tagsSchema,
} from "./common";

export const channelEnum = z.enum(["ig_dm", "linkedin", "whatsapp", "email", "call", "other"]);
export const directionEnum = z.enum(["inbound", "outbound"]);
export const outreachStatusEnum = z.enum([
  "not_contacted",
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
  // talent_id is now optional: lets you log a brand you want to pitch but
  // haven't paired with a specific talent yet.
  talent_id: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .transform((v) => (v ? v : null))
    .nullable()
    .optional(),
  brand_id: z.string().uuid({ message: "Required" }),
  primary_poc_id: z.string().uuid().nullable().optional(),
  channel: channelEnum,
  direction: directionEnum.default("outbound"),
  status: outreachStatusEnum.default("prospected"),
  deliverables: optionalStringSchema.nullable().default(null),
  proposed_amount: optionalIntSchema.nullable().default(null),
  negotiated_amount: optionalIntSchema.nullable().default(null),
  agreed_amount: optionalIntSchema.nullable().default(null),
  commission_pct: optionalDecimalSchema.nullable().default(null),
  reached_out_at: optionalDateSchema.nullable().default(null),
  // next_followup_at is now optional: lets you mark an outreach as "no follow-up"
  // when the brand said no or never replied. Null rows are hidden from Inbox.
  next_followup_at: optionalDateSchema.nullable().default(null),
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
