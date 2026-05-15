"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import {
  managedBrandSchema,
  type ManagedBrandInput,
} from "@/lib/validations/managed-brand";

export async function createManagedBrand(input: ManagedBrandInput) {
  await requireProfile();
  const data = managedBrandSchema.parse(input);
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("managed_brands")
    .insert(data)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/managed-brands");
  redirect(`/managed-brands/${created.id}`);
}

export async function updateManagedBrand(
  id: string,
  input: Partial<ManagedBrandInput>,
) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("managed_brands").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/managed-brands/${id}`);
  revalidatePath("/managed-brands");
}
