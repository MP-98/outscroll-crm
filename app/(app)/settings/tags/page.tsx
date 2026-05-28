import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { TagsManager, type TagEntry } from "./tags-manager";

export const metadata = { title: "Tags · Settings" };

const ENTITY_LABELS: Record<string, string> = {
  talents: "talents",
  brands: "brands",
  outreaches: "outreaches",
  external_influencers: "influencers",
};

async function getTags(): Promise<TagEntry[]> {
  const supabase = await createClient();
  const [
    { data: talents },
    { data: brands },
    { data: outreaches },
    { data: influencers },
  ] = await Promise.all([
    supabase.from("talents").select("tags").not("tags", "is", null),
    supabase.from("brands").select("tags").not("tags", "is", null),
    supabase.from("outreaches").select("tags").not("tags", "is", null),
    supabase.from("external_influencers").select("tags").not("tags", "is", null),
  ]);

  // Aggregate case-insensitively. Key = lowercase; display = first-seen casing.
  const map = new Map<
    string,
    { display: string; total: number; byEntity: Record<string, number> }
  >();

  function addAll(rows: Array<{ tags: string[] | null }> | null, entity: string) {
    rows?.forEach((r) => {
      r.tags?.forEach((t) => {
        const key = t.toLowerCase();
        const entry =
          map.get(key) ?? { display: t, total: 0, byEntity: {} };
        entry.total += 1;
        entry.byEntity[entity] = (entry.byEntity[entity] ?? 0) + 1;
        map.set(key, entry);
      });
    });
  }
  addAll(talents, "talents");
  addAll(brands, "brands");
  addAll(outreaches, "outreaches");
  addAll(influencers, "external_influencers");

  return Array.from(map.values())
    .map((e) => ({
      tag: e.display,
      total: e.total,
      breakdown: Object.entries(e.byEntity)
        .map(([entity, count]) => `${count} ${ENTITY_LABELS[entity] ?? entity}`)
        .join(" · "),
    }))
    .sort((a, b) => b.total - a.total || a.tag.toLowerCase().localeCompare(b.tag.toLowerCase()));
}

export default async function TagsSettingsPage() {
  await requireProfile();
  const tags = await getTags();
  return (
    <section className="max-w-2xl space-y-4">
      <header>
        <h2 className="text-base font-semibold">Tags</h2>
        <p className="text-xs text-muted-foreground">
          Free-form tags across talents, brands, outreaches and influencers.
          Rename a tag here to fix a misspelling everywhere it&apos;s used — case
          variants are merged into your chosen spelling.
        </p>
      </header>
      <TagsManager initial={tags} />
    </section>
  );
}
