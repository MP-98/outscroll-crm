import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = { title: "Tags · Settings" };

async function getTagCloud(): Promise<Array<{ tag: string; count: number; entity: string }>> {
  const supabase = await createClient();
  const [{ data: talents }, { data: brands }, { data: outreaches }] = await Promise.all([
    supabase.from("talents").select("tags").not("tags", "is", null),
    supabase.from("brands").select("tags").not("tags", "is", null),
    supabase.from("outreaches").select("tags").not("tags", "is", null),
  ]);
  const out: Record<string, { count: number; entity: string }> = {};
  function addAll(rows: Array<{ tags: string[] | null }> | null, entity: string) {
    rows?.forEach((r) => {
      r.tags?.forEach((t) => {
        const key = `${entity}:${t}`;
        out[key] = out[key] ?? { count: 0, entity };
        out[key].count += 1;
      });
    });
  }
  addAll(talents, "talents");
  addAll(brands, "brands");
  addAll(outreaches, "outreaches");
  return Object.entries(out)
    .map(([key, v]) => ({ tag: key.split(":")[1], entity: v.entity, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

export default async function TagsSettingsPage() {
  await requireProfile();
  const cloud = await getTagCloud();
  const grouped: Record<string, Array<{ tag: string; count: number }>> = {};
  for (const item of cloud) {
    grouped[item.entity] ??= [];
    grouped[item.entity].push({ tag: item.tag, count: item.count });
  }
  return (
    <section className="max-w-2xl space-y-4">
      <header>
        <h2 className="text-base font-semibold">Tags</h2>
        <p className="text-xs text-muted-foreground">
          Tags are free-form per record. This page shows usage across the workspace.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["talents", "brands", "outreaches"] as const).map((entity) => (
          <Card key={entity}>
            <CardHeader>
              <CardTitle className="capitalize text-sm">{entity}</CardTitle>
              <CardDescription>{grouped[entity]?.length ?? 0} tags in use</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              {grouped[entity]?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {grouped[entity].map((t) => (
                    <span
                      key={t.tag}
                      className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs"
                    >
                      {t.tag}
                      <span className="text-muted-foreground">{t.count}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">None yet.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
