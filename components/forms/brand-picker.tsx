"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChevronDown, Check, Plus, Loader2, Building2 } from "lucide-react";
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
import { createBrandReturning } from "@/server/actions/brands";

export interface BrandOption {
  id: string;
  name: string;
  industry: string | null;
}

interface BrandPickerProps {
  brands: BrandOption[];
  value: string | null;
  onChange: (id: string, brand: BrandOption) => void;
}

export function BrandPicker({ brands, value, onChange }: BrandPickerProps) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<BrandOption[]>(brands);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setList(brands), [brands]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => b.name.toLowerCase().includes(q));
  }, [list, query]);

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.some((b) => b.name.toLowerCase() === q);
  }, [list, query]);

  const selected = list.find((b) => b.id === value) ?? null;

  function pick(b: BrandOption) {
    onChange(b.id, b);
    setOpen(false);
    setQuery("");
  }

  function startCreate() {
    setNewName(query.trim());
    setNewIndustry("");
    setCreating(true);
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    start(async () => {
      try {
        const created = await createBrandReturning({
          name: newName.trim(),
          industry: newIndustry.trim() || null,
          ig_handle: null,
          website: null,
          tags: [],
        });
        const opt: BrandOption = {
          id: created.id,
          name: created.name,
          industry: created.industry,
        };
        setList((prev) =>
          [...prev, opt].sort((a, b) => a.name.localeCompare(b.name)),
        );
        onChange(opt.id, opt);
        toast.success(`Created “${opt.name}”`);
        setCreating(false);
        setOpen(false);
        setQuery("");
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
        if (!o) {
          setCreating(false);
          setQuery("");
        } else {
          // Focus the input on open.
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <span className={cn(selected ? "text-foreground" : "text-muted-foreground")}>
            {selected ? (
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {selected.name}
                {selected.industry ? (
                  <span className="text-xs text-muted-foreground">
                    · {selected.industry}
                  </span>
                ) : null}
              </span>
            ) : (
              "Pick brand or type to create…"
            )}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {creating ? (
          <form onSubmit={submitCreate} className="p-3 space-y-2.5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Create new brand
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-brand-name" className="text-[10px]">
                Brand name
              </Label>
              <Input
                id="new-brand-name"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-brand-industry" className="text-[10px]">
                Industry (optional)
              </Label>
              <Input
                id="new-brand-industry"
                placeholder="e.g. Beauty, Fintech…"
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending || !newName.trim()}>
                {pending ? <Loader2 className="animate-spin" /> : <Plus />}
                Create
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="border-b border-border p-2">
              <Input
                ref={inputRef}
                placeholder="Search brands…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="px-2 py-2 text-xs text-muted-foreground">
                  No matches.
                </p>
              ) : (
                filtered.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => pick(b)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent",
                      value === b.id && "bg-accent/60",
                    )}
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{b.name}</span>
                      {b.industry ? (
                        <span className="text-xs text-muted-foreground truncate">
                          · {b.industry}
                        </span>
                      ) : null}
                    </span>
                    {value === b.id ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                ))
              )}
              {query.trim() && !exactMatch ? (
                <>
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={startCreate}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-primary hover:bg-accent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create &ldquo;{query.trim()}&rdquo; as new brand
                  </button>
                </>
              ) : null}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
