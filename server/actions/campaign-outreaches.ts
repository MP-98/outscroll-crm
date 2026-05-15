"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import {
  campaignOutreachSchema,
  campaignActivitySchema,
  type CampaignOutreachInput,
  type CampaignActivityInput,
} from "@/lib/validations/campaign-outreach";
import type {
  CampaignOutreachStatus,
  CampaignPaymentStatus,
} from "@/lib/supabase/types";
import { todayISO } from "@/lib/date";

export async function createCampaignOutreach(input: CampaignOutreachInput) {
  const profile = await requireProfile();
  const data = campaignOutreachSchema.parse(input);
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("campaign_outreaches")
    .insert({ ...data, owner_id: data.owner_id ?? profile.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("campaign_outreach_activities").insert({
    campaign_outreach_id: created.id,
    channel: "status_change",
    direction: "internal",
    summary: `created → ${data.status}`,
    author_id: profile.id,
  });

  revalidatePath(`/campaigns/${data.campaign_id}`);
  revalidatePath("/inbox");
  return { id: created.id as string };
}

/** Add multiple shortlisted rows to a campaign at once. */
export async function bulkAddToCampaign(
  campaignId: string,
  picks: Array<
    | { kind: "external"; id: string }
    | { kind: "talent"; id: string }
  >,
) {
  const profile = await requireProfile();
  if (picks.length === 0) return { added: 0 };
  const supabase = await createClient();
  const now = todayISO();

  // De-duplicate against existing rows in this campaign.
  const { data: existing } = await supabase
    .from("campaign_outreaches")
    .select("external_influencer_id, talent_id")
    .eq("campaign_id", campaignId);
  const existingExternal = new Set(
    (existing ?? [])
      .map((r) => r.external_influencer_id)
      .filter(Boolean) as string[],
  );
  const existingTalent = new Set(
    (existing ?? []).map((r) => r.talent_id).filter(Boolean) as string[],
  );

  const rows = picks
    .filter((p) =>
      p.kind === "external"
        ? !existingExternal.has(p.id)
        : !existingTalent.has(p.id),
    )
    .map((p) => ({
      campaign_id: campaignId,
      external_influencer_id: p.kind === "external" ? p.id : null,
      talent_id: p.kind === "talent" ? p.id : null,
      status: "shortlisted" as const,
      next_followup_at: now,
      owner_id: profile.id,
    }));

  if (rows.length === 0) return { added: 0 };

  const { data: inserted, error } = await supabase
    .from("campaign_outreaches")
    .insert(rows)
    .select("id");
  if (error) throw new Error(error.message);

  // Initial activity rows.
  if (inserted && inserted.length > 0) {
    await supabase.from("campaign_outreach_activities").insert(
      inserted.map((r) => ({
        campaign_outreach_id: r.id,
        channel: "status_change" as const,
        direction: "internal" as const,
        summary: "created → shortlisted",
        author_id: profile.id,
      })),
    );
  }

  revalidatePath(`/campaigns/${campaignId}`);
  return { added: rows.length };
}

export async function updateCampaignOutreach(
  id: string,
  input: Partial<CampaignOutreachInput>,
) {
  await requireProfile();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("campaign_outreaches")
    .select("campaign_id")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("campaign_outreaches")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (existing?.campaign_id) {
    revalidatePath(`/campaigns/${existing.campaign_id}`);
  }
  revalidatePath(`/campaign-outreaches/${id}`);
  revalidatePath("/inbox");
}

export async function transitionCampaignOutreachStatus(
  id: string,
  status: CampaignOutreachStatus,
  lostReason?: string,
) {
  void lostReason; // no lost_reason column on campaign_outreaches; reserved.
  await requireProfile();
  const supabase = await createClient();
  const update: Record<string, unknown> = { status };
  if (status === "paid") {
    update.paid_on = todayISO();
    update.payment_status = "paid";
  }
  const { data: existing } = await supabase
    .from("campaign_outreaches")
    .select("campaign_id")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("campaign_outreaches")
    .update(update)
    .eq("id", id);
  if (error) throw new Error(error.message);
  // Trigger inserts the status_change activity automatically.
  if (existing?.campaign_id) {
    revalidatePath(`/campaigns/${existing.campaign_id}`);
  }
  revalidatePath(`/campaign-outreaches/${id}`);
  revalidatePath("/inbox");
}

export async function setPaymentStatus(
  id: string,
  payment_status: CampaignPaymentStatus,
) {
  await requireProfile();
  const supabase = await createClient();
  const update: Record<string, unknown> = { payment_status };
  if (payment_status === "paid") update.paid_on = todayISO();
  const { data: existing } = await supabase
    .from("campaign_outreaches")
    .select("campaign_id")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("campaign_outreaches")
    .update(update)
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (existing?.campaign_id) {
    revalidatePath(`/campaigns/${existing.campaign_id}`);
  }
  revalidatePath(`/campaign-outreaches/${id}`);
}

export async function setDeliverableDone(id: string, done: boolean) {
  await requireProfile();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("campaign_outreaches")
    .select("campaign_id")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("campaign_outreaches")
    .update({ deliverable_done: done })
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (existing?.campaign_id) {
    revalidatePath(`/campaigns/${existing.campaign_id}`);
  }
  revalidatePath(`/campaign-outreaches/${id}`);
}

export async function logCampaignActivity(input: CampaignActivityInput) {
  const profile = await requireProfile();
  const data = campaignActivitySchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("campaign_outreach_activities").insert({
    ...data,
    author_id: profile.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/campaign-outreaches/${data.campaign_outreach_id}`);
}

export async function snoozeCampaignOutreach(id: string, newDate: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaign_outreaches")
    .update({ next_followup_at: newDate })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidatePath(`/campaign-outreaches/${id}`);
}
