"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upsertPoc, deletePoc } from "@/server/actions/brands";
import type { BrandPoc } from "@/lib/supabase/types";

export function PocsTab({ brandId, initial }: { brandId: string; initial: BrandPoc[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<BrandPoc | "new" | null>(null);
  const [pending, start] = useTransition();

  function startNew() {
    setEditing("new");
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          People at this brand
          <Button size="sm" variant="secondary" onClick={startNew}>
            <Plus />
            Add POC
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {editing ? (
          <PocEditor
            initial={editing === "new" ? null : editing}
            onCancel={() => setEditing(null)}
            onSave={(saved) => {
              start(async () => {
                try {
                  await upsertPoc(brandId, saved);
                  if (saved.id) {
                    setItems((prev) =>
                      prev.map((p) => (p.id === saved.id ? { ...p, ...saved } : p)),
                    );
                  } else {
                    const optimistic: BrandPoc = {
                      id: crypto.randomUUID(),
                      brand_id: brandId,
                      ...saved,
                    } as BrandPoc;
                    setItems((prev) => [...prev, optimistic]);
                  }
                  setEditing(null);
                  toast.success(saved.id ? "POC updated" : "POC added");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Save failed");
                }
              });
            }}
            pending={pending}
          />
        ) : null}
        {items.length === 0 ? (
          <div className="px-4 py-8 text-xs text-muted-foreground text-center">
            No POCs added yet.
          </div>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {items.map((p) => (
              <li key={p.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.full_name}</span>
                    {p.role_title ? (
                      <span className="text-xs text-muted-foreground">{p.role_title}</span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {p.email ? <span>{p.email}</span> : null}
                    {p.phone ? <span>{p.phone}</span> : null}
                    {p.ig_handle ? <span>@{p.ig_handle}</span> : null}
                    {p.linkedin_url ? (
                      <a href={p.linkedin_url} target="_blank" rel="noopener" className="hover:text-primary">
                        LinkedIn
                      </a>
                    ) : null}
                  </div>
                  {p.notes ? <p className="mt-1 text-xs text-foreground/80">{p.notes}</p> : null}
                </div>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setEditing(p)}
                  aria-label="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    start(async () => {
                      try {
                        await deletePoc(brandId, p.id);
                        setItems((prev) => prev.filter((x) => x.id !== p.id));
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed");
                      }
                    })
                  }
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface PocDraft {
  id?: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  ig_handle: string | null;
  linkedin_url: string | null;
  notes: string | null;
}

function PocEditor({
  initial,
  onSave,
  onCancel,
  pending,
}: {
  initial: BrandPoc | null;
  onSave: (data: PocDraft) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [draft, setDraft] = useState<PocDraft>({
    id: initial?.id,
    full_name: initial?.full_name ?? "",
    role_title: initial?.role_title ?? null,
    email: initial?.email ?? null,
    phone: initial?.phone ?? null,
    ig_handle: initial?.ig_handle ?? null,
    linkedin_url: initial?.linkedin_url ?? null,
    notes: initial?.notes ?? null,
  });

  return (
    <form
      className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 py-4 border-b border-border"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.full_name.trim()) return;
        onSave(draft);
      }}
    >
      <Field label="Name *">
        <Input
          required
          value={draft.full_name}
          onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
        />
      </Field>
      <Field label="Role">
        <Input
          value={draft.role_title ?? ""}
          onChange={(e) => setDraft({ ...draft, role_title: e.target.value || null })}
        />
      </Field>
      <Field label="Email">
        <Input
          type="email"
          value={draft.email ?? ""}
          onChange={(e) => setDraft({ ...draft, email: e.target.value || null })}
        />
      </Field>
      <Field label="Phone">
        <Input
          value={draft.phone ?? ""}
          onChange={(e) => setDraft({ ...draft, phone: e.target.value || null })}
        />
      </Field>
      <Field label="IG handle">
        <Input
          value={draft.ig_handle ?? ""}
          onChange={(e) => setDraft({ ...draft, ig_handle: e.target.value || null })}
        />
      </Field>
      <Field label="LinkedIn URL">
        <Input
          value={draft.linkedin_url ?? ""}
          onChange={(e) => setDraft({ ...draft, linkedin_url: e.target.value || null })}
        />
      </Field>
      <Field label="Notes" className="md:col-span-2">
        <Textarea
          rows={2}
          value={draft.notes ?? ""}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value || null })}
        />
      </Field>
      <div className="md:col-span-2 flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
