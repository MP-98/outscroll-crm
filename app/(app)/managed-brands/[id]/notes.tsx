"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateManagedBrand } from "@/server/actions/managed-brands";

export function ManagedBrandNotes({
  brandId,
  notes,
}: {
  brandId: string;
  notes: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes ?? "");
  const [pending, start] = useTransition();
  const router = useRouter();

  function save() {
    start(async () => {
      try {
        await updateManagedBrand(brandId, { notes: draft.trim() || null });
        toast.success("Notes updated");
        setEditing(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Notes
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setDraft(notes ?? "");
                setEditing(false);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-2">
            <Textarea
              autoFocus
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(notes ?? "");
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={save} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        ) : notes ? (
          <p className="text-sm whitespace-pre-wrap">{notes}</p>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add notes
          </button>
        )}
      </CardContent>
    </Card>
  );
}
