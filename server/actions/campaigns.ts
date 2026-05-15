"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { campaignSchema, type CampaignInput } from "@/lib/validations/campaign";

export async function createCampaign(input: CampaignInput) {
  const profile = await requireProfile();
  const data = campaignSchema.parse(input);
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("campaigns")
    .insert({ ...data, owner_id: data.owner_id ?? profile.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/campaigns");
  redirect(`/campaigns/${created.id}`);
}

export async function updateCampaign(id: string, input: Partial<CampaignInput>) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
}
