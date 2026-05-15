import { z } from "zod";
import {
  optionalDateSchema,
  optionalIntSchema,
  optionalStringSchema,
} from "./common";
import { channelEnum } from "./outreach";

export const campaignOutreachStatusEnum = z.enum([
  "shortlisted",
  "contacted",
  "in_conversation",
  "negotiating",
  "confirmed",
  "live",
  "paid",
  "lost",
  "on_hold",
]);

export const campaignPaymentStatusEnum = z.enum([
  "pending",
  "invoiced",
  "paid",
  "overdue",
  "na",
]);

export const campaignOutreachSchema = z
  .object({
    campaign_id: z.string().uuid({ message: "Required" }),
    external_influencer_id: z.string().uuid().nullable().optional(),
    talent_id: z.string().uuid().nullable().optional(),
    channel: channelEnum.nullable().optional(),
    status: campaignOutreachStatusEnum.default("shortlisted"),
    proposed_amount: optionalIntSchema.nullable().default(null),
    agreed_amount: optionalIntSchema.nullable().default(null),
    deliverables: optionalStringSchema.nullable().default(null),
    deliverable_done: z.boolean().default(false),
    next_followup_at: optionalDateSchema.nullable().default(null),
    owner_id: z.string().uuid().nullable().optional(),
    payment_status: campaignPaymentStatusEnum.default("pending"),
    paid_on: optionalDateSchema.nullable().default(null),
    notes: optionalStringSchema.nullable().default(null),
  })
  .refine(
    (v) => !!v.external_influencer_id || !!v.talent_id,
    "Pick an influencer or a talent",
  );

export const campaignActivitySchema = z.object({
  campaign_outreach_id: z.string().uuid(),
  channel: z
    .enum(["ig_dm", "linkedin", "whatsapp", "email", "call", "note", "other"])
    .default("note"),
  direction: z.enum(["outbound", "inbound", "internal"]).nullable().default(null),
  summary: z.string().trim().min(1, "Required"),
  attachment_url: optionalStringSchema.nullable().default(null),
});

export type CampaignOutreachInput = z.infer<typeof campaignOutreachSchema>;
export type CampaignActivityInput = z.infer<typeof campaignActivitySchema>;
