"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireRole } from "@/lib/auth";
import { talentSchema, type TalentInput } from "@/lib/validations/talent";
import { redirect } from "next/navigation";

export async function createTalent(input: TalentInput) {
  const profile = await requireProfile();
  const data = talentSchema.parse(input);
  const supabase = await createClient();

  const { contacts, ...talentRow } = data;
  const { data: created, error } = await supabase
    .from("talents")
    .insert({
      ...talentRow,
      manager_id: talentRow.manager_id ?? profile.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (contacts.length > 0) {
    const rows = contacts.map((c) => ({
      talent_id: created.id,
      kind: c.kind,
      value: c.value,
      is_primary: c.is_primary,
      label: c.label,
    }));
    const { error: contactErr } = await supabase.from("talent_contacts").insert(rows);
    if (contactErr) throw new Error(contactErr.message);
  }

  revalidatePath("/talents");
  redirect(`/talents/${created.id}`);
}

export async function updateTalent(id: string, input: TalentInput) {
  await requireProfile();
  const data = talentSchema.parse(input);
  const supabase = await createClient();
  const { contacts: _contacts, ...talentRow } = data;
  void _contacts;

  const { error } = await supabase.from("talents").update(talentRow).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/talents/${id}`);
  revalidatePath("/talents");
}

export async function upsertContact(
  talentId: string,
  contact: { id?: string; kind: string; value: string; is_primary: boolean; label: string | null },
) {
  await requireProfile();
  const supabase = await createClient();
  if (contact.id) {
    const { error } = await supabase
      .from("talent_contacts")
      .update({
        kind: contact.kind,
        value: contact.value,
        is_primary: contact.is_primary,
        label: contact.label,
      })
      .eq("id", contact.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("talent_contacts").insert({
      talent_id: talentId,
      kind: contact.kind,
      value: contact.value,
      is_primary: contact.is_primary,
      label: contact.label,
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/talents/${talentId}`);
}

export async function deleteContact(talentId: string, contactId: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("talent_contacts").delete().eq("id", contactId);
  if (error) throw new Error(error.message);
  revalidatePath(`/talents/${talentId}`);
}

export async function reassignTalentManager(talentId: string, managerId: string | null) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("talents")
    .update({ manager_id: managerId })
    .eq("id", talentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/talents/${talentId}`);
  revalidatePath("/talents");
}
