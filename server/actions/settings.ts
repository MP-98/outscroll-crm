"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireProfile, requireRole } from "@/lib/auth";
import type { UserRole } from "@/lib/supabase/types";

const TAGGED_TABLES = [
  "talents",
  "brands",
  "outreaches",
  "external_influencers",
] as const;

/** Rename a tag everywhere it appears, merging all case variants into the new
 *  spelling. e.g. rename "fashion" → "Fashion" also sweeps "FASHION".
 *  Returns { error } on failure so the client can show a real toast. */
export async function renameTag(oldTag: string, newTag: string) {
  await requireProfile();
  const from = oldTag.trim();
  const to = newTag.trim();
  if (!from || !to) return { error: "Both the current and new tag are required." };
  const lowerFrom = from.toLowerCase();
  const supabase = await createClient();

  let updated = 0;
  for (const table of TAGGED_TABLES) {
    const { data, error } = await supabase.from(table).select("id, tags");
    if (error) return { error: error.message };
    for (const row of (data ?? []) as Array<{ id: string; tags: string[] | null }>) {
      const tags = row.tags ?? [];
      if (!tags.some((t) => t.toLowerCase() === lowerFrom)) continue;
      // Replace every case-variant of the old tag, deduping case-insensitively.
      const seen = new Set<string>();
      const next: string[] = [];
      for (const t of tags) {
        const replaced = t.toLowerCase() === lowerFrom ? to : t;
        const key = replaced.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          next.push(replaced);
        }
      }
      const { error: upErr } = await supabase
        .from(table)
        .update({ tags: next })
        .eq("id", row.id);
      if (upErr) return { error: upErr.message };
      updated += 1;
    }
  }

  revalidatePath("/settings/tags");
  revalidatePath("/influencers");
  revalidatePath("/talents");
  revalidatePath("/outreaches");
  return { ok: true as const, updated };
}

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

export async function inviteTeammate(
  email: string,
  password: string,
  role: UserRole,
  full_name?: string,
) {
  await requireRole("admin");
  if (!email.includes("@")) throw new Error("Invalid email");
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: full_name ? { full_name } : undefined,
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

export async function resetTeammatePassword(userId: string, password: string) {
  await requireRole("admin");
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const admin = createAdminClient();
  // email_confirm: true clears Supabase's email-not-confirmed gate for legacy
  // accounts created before we switched to direct createUser.
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings/team");
}

export async function updateMyPassword(password: string) {
  await requireProfile();
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function updateTeammateRole(userId: string, role: UserRole) {
  const me = await requireRole("admin");
  if (!me.is_seed_admin && !me.can_configure_team) {
    throw new Error("You don't have permission to change roles");
  }
  const supabase = await createClient();
  // Don't allow demoting the seed admin.
  const { data: target } = await supabase
    .from("profiles")
    .select("is_seed_admin")
    .eq("id", userId)
    .maybeSingle<{ is_seed_admin: boolean }>();
  if (target?.is_seed_admin) {
    throw new Error("Cannot change the seed admin's role");
  }
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/team");
}

export async function updateMemberSidebar(userId: string, allowed: string[]) {
  const me = await requireRole("admin");
  if (!me.is_seed_admin && !me.can_configure_team) {
    throw new Error("You don't have permission to change tab access");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ allowed_sidebar: allowed })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/team");
}

export async function setAdminCanConfigureTeam(userId: string, value: boolean) {
  const me = await requireProfile();
  if (!me.is_seed_admin) {
    throw new Error("Only the seed admin can change this setting");
  }
  if (userId === me.id) {
    throw new Error("Seed admin always has permission to configure team");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ can_configure_team: value })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/team");
}
