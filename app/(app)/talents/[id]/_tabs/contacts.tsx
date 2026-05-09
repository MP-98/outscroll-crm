"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelIcon } from "@/components/channel-icon";
import { upsertContact, deleteContact } from "@/server/actions/talents";
import type { TalentContact, ContactKind } from "@/lib/supabase/types";

export function ContactsTab({
  talentId,
  contacts,
}: {
  talentId: string;
  contacts: TalentContact[];
}) {
  const [items, setItems] = useState(contacts);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{
    kind: ContactKind;
    value: string;
    is_primary: boolean;
    label: string;
  }>({ kind: "phone", value: "", is_primary: false, label: "" });
  const [pending, start] = useTransition();

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.value.trim()) return;
    start(async () => {
      try {
        await upsertContact(talentId, {
          kind: draft.kind,
          value: draft.value.trim(),
          is_primary: draft.is_primary,
          label: draft.label.trim() || null,
        });
        toast.success("Contact added");
        setItems((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            talent_id: talentId,
            kind: draft.kind,
            value: draft.value.trim(),
            is_primary: draft.is_primary,
            label: draft.label.trim() || null,
          },
        ]);
        setDraft({ kind: "phone", value: "", is_primary: false, label: "" });
        setAdding(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function onDelete(id: string) {
    start(async () => {
      try {
        await deleteContact(talentId, id);
        setItems((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          Contacts
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <Plus />
            Add
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {adding ? (
          <form onSubmit={onAdd} className="grid grid-cols-[140px_1fr_1fr_120px] gap-2 px-4 py-3 border-b border-border items-end">
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v as ContactKind })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="ig_link">IG link</SelectItem>
                  <SelectItem value="ig_dm">IG DM</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Value</Label>
              <Input
                placeholder="Number or handle…"
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input
                placeholder="Optional"
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </div>
            <div className="flex gap-1">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
        {items.length === 0 ? (
          <div className="px-4 py-8 text-xs text-muted-foreground text-center">
            No contacts yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((c) => (
              <li key={c.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <ChannelIcon channel={c.kind} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.value}</div>
                  {c.label ? (
                    <div className="text-xs text-muted-foreground">{c.label}</div>
                  ) : null}
                </div>
                {c.is_primary ? (
                  <span className="text-[10px] uppercase tracking-wide text-primary">primary</span>
                ) : null}
                <button
                  onClick={() => onDelete(c.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete contact"
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
