"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import {
  outreachSchema,
  activitySchema,
  type OutreachInput,
  type ActivityInput,
} from "@/lib/validations/outreach";
import type { OutreachStatus } from "@/lib/supabase/types";

export async function createOutreach(input: OutreachInput) {
  const profile = await requireProfile();
  const data = outreachSchema.parse(input);
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("outreaches")
    .insert({
      ...data,
      owner_id: data.owner_id ?? profile.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("outreach_activities").insert({
    outreach_id: created.id,
    channel: "status_change",
    direction: "internal",
    summary: `created → ${data.status}`,
    author_id: profile.id,
  });

  revalidatePath("/outreaches");
  revalidatePath("/inbox");
  redirect(`/outreaches/${created.id}`);
}

export async function updateOutreach(id: string, input: Partial<OutreachInput>) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("outreaches").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/outreaches/${id}`);
  revalidatePath("/outreaches");
  revalidatePath("/inbox");
}

export async function transitionStatus(id: string, status: OutreachStatus, lostReason?: string) {
  await requireProfile();
  const supabase = await createClient();
  const update: Record<string, unknown> = { status };
  if (status === "paid") update.paid_at = new Date().toISOString().slice(0, 10);
  if (status === "lost" && lostReason) update.lost_reason = lostReason;
  const { error } = await supabase.from("outreaches").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  // Trigger writes the status_change activity row.
  revalidatePath(`/outreaches/${id}`);
  revalidatePath("/outreaches");
  revalidatePath("/inbox");
}

export async function logActivity(input: ActivityInput) {
  const profile = await requireProfile();
  const data = activitySchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("outreach_activities").insert({
    ...data,
    author_id: profile.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/outreaches/${data.outreach_id}`);
}

export async function snoozeOutreach(id: string, newDate: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("outreaches")
    .update({ next_followup_at: newDate })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidatePath("/outreaches");
}
