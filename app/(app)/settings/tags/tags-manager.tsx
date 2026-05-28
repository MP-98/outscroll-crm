"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Tag as TagIcon } from "lucide-react";
import { renameTag } from "@/server/actions/settings";

export interface TagEntry {
  tag: string;
  total: number;
  breakdown: string;
}

export function TagsManager({ initial }: { initial: TagEntry[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();

  const filtered = initial.filter((t) =>
    t.tag.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function startEdit(tag: string) {
    setEditing(tag);
    setDraft(tag);
  }

  function save(oldTag: string) {
    const next = draft.trim();
    if (!next) {
      toast.error("Tag can't be empty");
      return;
    }
    if (next === oldTag) {
      setEditing(null);
      return;
    }
    start(async () => {
      try {
        const result = await renameTag(oldTag, next);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success(
          `Renamed to “${next}” across ${result?.updated ?? 0} record${
            result?.updated === 1 ? "" : "s"
          }`,
        );
        setEditing(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Rename failed");
      }
    });
  }

  if (initial.length === 0) {
    return (
      <EmptyState
        icon={<TagIcon />}
        title="No tags yet"
        description="Tags you add on talents, brands, outreaches or influencers will show up here."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted-foreground text-center">
            No tags match.
          </p>
        ) : (
          filtered.map((t) => (
            <div key={t.tag} className="flex items-center gap-3 px-4 py-2.5">
              {editing === t.tag ? (
                <form
                  className="flex items-center gap-2 flex-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save(t.tag);
                  }}
                >
                  <Input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="h-8 max-w-xs"
                  />
                  <Button type="submit" size="sm" disabled={pending}>
                    {pending ? <Loader2 className="animate-spin" /> : <Check />}
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(null)}
                    disabled={pending}
                  >
                    <X />
                  </Button>
                </form>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-0.5 text-sm font-medium">
                    {t.tag}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.total} use{t.total === 1 ? "" : "s"}
                    {t.breakdown ? ` · ${t.breakdown}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(t.tag)}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                    title="Rename tag"
                    aria-label={`Rename ${t.tag}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Renaming updates the tag on every talent, brand, outreach and influencer
        that uses it — including other casings.
      </p>
    </div>
  );
}
