"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import {
  externalInfluencerSchema,
  type ExternalInfluencerInput,
} from "@/lib/validations/external-influencer";

export async function createInfluencer(input: ExternalInfluencerInput) {
  await requireProfile();
  const data = externalInfluencerSchema.parse(input);
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("external_influencers")
    .insert(data)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/influencers");
  redirect(`/influencers/${created.id}`);
}

export async function updateInfluencer(
  id: string,
  input: Partial<ExternalInfluencerInput>,
) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("external_influencers")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/influencers/${id}`);
  revalidatePath("/influencers");
}
