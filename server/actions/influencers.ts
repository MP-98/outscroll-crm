"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import {
  externalInfluencerSchema,
  type ExternalInfluencerInput,
} from "@/lib/validations/external-influencer";

const DUPLICATE_HANDLE_MSG =
  "An influencer with this Instagram handle is already in the pool. Search the Influencers list for it.";

// Server actions return { error } for expected failures instead of throwing —
// Next.js redacts thrown error messages in production, so returning the message
// is the only way to surface a useful toast to the user.
export async function createInfluencer(input: ExternalInfluencerInput) {
  await requireProfile();
  const data = externalInfluencerSchema.parse(input);
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("external_influencers")
    .insert(data)
    .select("id")
    .single();
  if (error) {
    return { error: error.code === "23505" ? DUPLICATE_HANDLE_MSG : error.message };
  }
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
  if (error) {
    return { error: error.code === "23505" ? DUPLICATE_HANDLE_MSG : error.message };
  }
  revalidatePath(`/influencers/${id}`);
  revalidatePath("/influencers");
  return { ok: true as const };
}
