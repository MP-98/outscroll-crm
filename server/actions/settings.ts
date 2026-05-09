"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireProfile, requireRole } from "@/lib/auth";
import type { UserRole } from "@/lib/supabase/types";

export async function createNiche(name: string) {
  await requireProfile();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name required");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("niches")
    .insert({ name: trimmed })
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/settings/niches");
  return data;
}

export async function deleteNiche(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { data: nicheRow } = await supabase.from("niches").select("name").eq("id", id).single();
  if (nicheRow?.name) {
    const { count } = await supabase
      .from("talents")
      .select("id", { count: "exact", head: true })
      .contains("niches", [nicheRow.name]);
    if ((count ?? 0) > 0) {
      throw new Error(`Cannot delete: ${count} talent(s) use this niche`);
    }
  }
  const { error } = await supabase.from("niches").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/niches");
}

export async function updateProfile(input: { full_name: string; avatar_url: string | null }) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name.trim(),
      avatar_url: input.avatar_url,
    })
    .eq("id", profile.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/profile");
}

export async function inviteTeammate(email: string, role: UserRole, full_name?: string) {
  await requireRole("admin");
  if (!email.includes("@")) throw new Error("Invalid email");
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: full_name ? { full_name } : undefined,
  });
  if (error) throw new Error(error.message);
  if (data.user) {
    const { error: upsertErr } = await admin
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          email,
          full_name: full_name ?? email,
          role,
        },
        { onConflict: "id" },
      );
    if (upsertErr) throw new Error(upsertErr.message);
  }
  revalidatePath("/settings/team");
}

export async function updateTeammateRole(userId: string, role: UserRole) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/team");
}
