"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { brandSchema, brandPocSchema, type BrandInput, type BrandPocInput } from "@/lib/validations/brand";

export async function createBrand(input: BrandInput) {
  await requireProfile();
  const data = brandSchema.parse(input);
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("brands")
    .insert(data)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/brands");
  redirect(`/brands/${created.id}`);
}

/** Same as createBrand but returns the created row instead of redirecting.
 *  Used by the inline brand picker inside the New Outreach form. */
export async function createBrandReturning(input: BrandInput) {
  await requireProfile();
  const data = brandSchema.parse(input);
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("brands")
    .insert(data)
    .select("id, name, industry")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/brands");
  return created as { id: string; name: string; industry: string | null };
}

export async function updateBrand(id: string, input: BrandInput) {
  await requireProfile();
  const data = brandSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("brands").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/brands/${id}`);
  revalidatePath("/brands");
}

export async function upsertPoc(
  brandId: string,
  poc: BrandPocInput & { id?: string },
) {
  await requireProfile();
  const data = brandPocSchema.parse(poc);
  const supabase = await createClient();
  if (poc.id) {
    const { error } = await supabase.from("brand_pocs").update(data).eq("id", poc.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("brand_pocs").insert({ ...data, brand_id: brandId });
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/brands/${brandId}`);
}

export async function deletePoc(brandId: string, pocId: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("brand_pocs").delete().eq("id", pocId);
  if (error) throw new Error(error.message);
  revalidatePath(`/brands/${brandId}`);
}

/** Creates a POC and returns the new row — for inline POC creation inside the
 *  outreach form/detail without a full page navigation. */
export async function createPocReturning(brandId: string, poc: BrandPocInput) {
  await requireProfile();
  const data = brandPocSchema.parse(poc);
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("brand_pocs")
    .insert({ ...data, brand_id: brandId })
    .select("id, brand_id, full_name, role_title, email, phone, ig_handle, linkedin_url")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/brands/${brandId}`);
  return created as {
    id: string;
    brand_id: string;
    full_name: string;
    role_title: string | null;
    email: string | null;
    phone: string | null;
    ig_handle: string | null;
    linkedin_url: string | null;
  };
}
