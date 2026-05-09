"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { runIgSync, ApifyError } from "@/lib/apify/client";

const PER_USER_COOLDOWN_MS = 30_000; // 1 sync per user per 30s
const GLOBAL_RECENT_WINDOW_MS = 60_000;
const GLOBAL_RECENT_LIMIT = 5; // 5 syncs per minute, system-wide

async function checkRateLimit(userId: string) {
  const supabase = await createClient();
  const sinceUser = new Date(Date.now() - PER_USER_COOLDOWN_MS).toISOString();
  const sinceGlobal = new Date(Date.now() - GLOBAL_RECENT_WINDOW_MS).toISOString();

  const [{ count: userCount }, { count: globalCount }] = await Promise.all([
    supabase
      .from("ig_sync_runs")
      .select("id", { count: "exact", head: true })
      .eq("triggered_by", userId)
      .gte("created_at", sinceUser),
    supabase
      .from("ig_sync_runs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sinceGlobal),
  ]);

  if ((userCount ?? 0) > 0) {
    throw new Error("Slow down — wait 30 seconds between syncs.");
  }
  if ((globalCount ?? 0) >= GLOBAL_RECENT_LIMIT) {
    throw new Error("System sync rate limit hit. Try again in a minute.");
  }
}

export async function syncTalentFromInstagram(talentId: string) {
  const profile = await requireProfile();
  await checkRateLimit(profile.id);
  const supabase = await createClient();

  const { data: talent, error: tErr } = await supabase
    .from("talents")
    .select("id, ig_handle")
    .eq("id", talentId)
    .single();
  if (tErr || !talent) throw new Error("Talent not found");

  const { data: runRow, error: runErr } = await supabase
    .from("ig_sync_runs")
    .insert({
      target_kind: "talent",
      target_id: talent.id,
      ig_handle: talent.ig_handle,
      status: "running",
      triggered_by: profile.id,
    })
    .select("id")
    .single();
  if (runErr || !runRow) throw new Error(runErr?.message ?? "Failed to start sync");

  try {
    const result = await runIgSync(talent.ig_handle);

    const updates: Record<string, unknown> = { ig_metrics_synced_at: new Date().toISOString() };
    if (result.followers != null) updates.ig_followers = result.followers;
    if (result.avg_reel_views != null) updates.avg_reel_views = result.avg_reel_views;
    if (Object.keys(updates).length > 1) {
      const { error: upErr } = await supabase.from("talents").update(updates).eq("id", talent.id);
      if (upErr) throw new Error(upErr.message);
    }

    await supabase
      .from("ig_sync_runs")
      .update({
        status: "succeeded",
        followers: result.followers,
        avg_reel_views: result.avg_reel_views,
        reels_sampled: result.reels_sampled,
        cost_credits: result.cost_credits,
        apify_run_id: result.apify_run_id,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runRow.id);

    revalidatePath(`/talents/${talentId}`);
    return { ok: true, ...result };
  } catch (err) {
    const message =
      err instanceof ApifyError ? err.message : err instanceof Error ? err.message : String(err);
    await supabase
      .from("ig_sync_runs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runRow.id);
    throw new Error(message);
  }
}
