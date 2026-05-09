"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createNiche, deleteNiche } from "@/server/actions/settings";
import type { Niche } from "@/lib/supabase/types";

export function NichesManager({ initial, canDelete }: { initial: Niche[]; canDelete: boolean }) {
  const [name, setName] = useState("");
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    start(async () => {
      try {
        const created = await createNiche(name);
        if (created) setItems((prev) => [...prev, created as Niche].sort((a, b) => a.name.localeCompare(b.name)));
        setName("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function onDelete(id: string) {
    start(async () => {
      try {
        await deleteNiche(id);
        setItems((prev) => prev.filter((n) => n.id !== id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onAdd} className="flex gap-2">
        <Input
          placeholder="Add a niche…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          Add
        </Button>
      </form>
      <div className="rounded-lg border border-border divide-y divide-border bg-card">
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">No niches yet.</div>
        ) : (
          items.map((n) => (
            <div key={n.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{n.name}</span>
              {canDelete ? (
                <button
                  onClick={() => onDelete(n.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Delete ${n.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
