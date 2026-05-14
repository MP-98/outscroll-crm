"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Check, Plus, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createPocReturning } from "@/server/actions/brands";

export interface PocOption {
  id: string;
  brand_id: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  ig_handle?: string | null;
  linkedin_url?: string | null;
}

interface PocPickerProps {
  brandId: string | null;
  /** All POCs the form knows about — already includes any just-created ones. */
  pocs: PocOption[];
  value: string | null;
  onChange: (id: string | null, poc: PocOption | null) => void;
  /** Called when a brand-new POC is created so the parent can extend its list. */
  onCreated: (poc: PocOption) => void;
}

export function PocPicker({ brandId, pocs, value, onChange, onCreated }: PocPickerProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState({
    full_name: "",
    role_title: "",
    email: "",
    phone: "",
    ig_handle: "",
    linkedin_url: "",
  });

  const brandPocs = brandId ? pocs.filter((p) => p.brand_id === brandId) : [];
  const selected = pocs.find((p) => p.id === value) ?? null;

  function resetDraft() {
    setDraft({
      full_name: "",
      role_title: "",
      email: "",
      phone: "",
      ig_handle: "",
      linkedin_url: "",
    });
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!brandId) {
      toast.error("Pick a brand first");
      return;
    }
    if (!draft.full_name.trim()) return;
    start(async () => {
      try {
        const created = await createPocReturning(brandId, {
          full_name: draft.full_name.trim(),
          role_title: draft.role_title.trim() || null,
          email: draft.email.trim() || null,
          phone: draft.phone.trim() || null,
          ig_handle: draft.ig_handle.trim() || null,
          linkedin_url: draft.linkedin_url.trim() || null,
          notes: null,
        });
        const opt: PocOption = {
          id: created.id,
          brand_id: created.brand_id,
          full_name: created.full_name,
          role_title: created.role_title,
          email: created.email,
          phone: created.phone,
          ig_handle: created.ig_handle,
          linkedin_url: created.linkedin_url,
        };
        onCreated(opt);
        onChange(opt.id, opt);
        toast.success(`Added POC “${opt.full_name}”`);
        resetDraft();
        setCreating(false);
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Create failed");
      }
    });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setCreating(false);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={!brandId}
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={cn(selected ? "text-foreground" : "text-muted-foreground")}>
            {selected ? (
              <span className="inline-flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {selected.full_name}
                {selected.role_title ? (
                  <span className="text-xs text-muted-foreground">
                    · {selected.role_title}
                  </span>
                ) : null}
              </span>
            ) : !brandId ? (
              "Pick a brand first"
            ) : (
              "Pick a POC or add new…"
            )}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {creating ? (
          <form onSubmit={submitCreate} className="p-3 space-y-2.5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Add new POC
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Full name</Label>
              <Input
                autoFocus
                value={draft.full_name}
                onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Role</Label>
                <Input
                  placeholder="e.g. Marketing lead"
                  value={draft.role_title}
                  onChange={(e) => setDraft({ ...draft, role_title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Phone</Label>
                <Input
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Email</Label>
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">IG handle</Label>
                <Input
                  value={draft.ig_handle}
                  onChange={(e) => setDraft({ ...draft, ig_handle: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">LinkedIn URL</Label>
                <Input
                  value={draft.linkedin_url}
                  onChange={(e) => setDraft({ ...draft, linkedin_url: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending || !draft.full_name.trim()}>
                {pending ? <Loader2 className="animate-spin" /> : <Plus />}
                Add POC
              </Button>
            </div>
          </form>
        ) : (
          <div className="max-h-72 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onChange(null, null);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent",
                value === null && "bg-accent/60",
              )}
            >
              <span className="text-muted-foreground italic">— None —</span>
              {value === null ? <Check className="h-3.5 w-3.5" /> : null}
            </button>
            {brandPocs.length > 0 ? <div className="my-1 h-px bg-border" /> : null}
            {brandPocs.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p.id, p);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent",
                  value === p.id && "bg-accent/60",
                )}
              >
                <span className="inline-flex items-center gap-2 truncate">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{p.full_name}</span>
                  {p.role_title ? (
                    <span className="text-xs text-muted-foreground truncate">
                      · {p.role_title}
                    </span>
                  ) : null}
                </span>
                {value === p.id ? <Check className="h-3.5 w-3.5" /> : null}
              </button>
            ))}
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => {
                resetDraft();
                setCreating(true);
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-primary hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" />
              Add new POC
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
