"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Plus, Loader2, User, Star, Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/status-pill";
import { igUrl, normalizeIgHandle } from "@/lib/ig";
import { fmtRelative } from "@/lib/date";
import { cn } from "@/lib/utils";
import { createPocReturning, upsertPoc } from "@/server/actions/brands";
import { updateOutreach } from "@/server/actions/outreaches";
import type { OutreachStatus } from "@/lib/supabase/types";

interface Poc {
  id: string;
  brand_id: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  ig_handle: string | null;
  linkedin_url: string | null;
}

interface BrandOutreach {
  id: string;
  status: OutreachStatus;
  updated_at: string;
  talent: { id: string; full_name: string } | null;
}

interface BrandPanelProps {
  outreachId: string;
  brand: {
    id: string;
    name: string;
    industry: string | null;
    ig_handle: string | null;
    website: string | null;
  } | null;
  pocs: Poc[];
  primaryPocId: string | null;
  otherOutreaches: BrandOutreach[];
}

type PocDraft = {
  full_name: string;
  role_title: string;
  email: string;
  phone: string;
  ig_handle: string;
  linkedin_url: string;
};

const EMPTY_DRAFT: PocDraft = {
  full_name: "",
  role_title: "",
  email: "",
  phone: "",
  ig_handle: "",
  linkedin_url: "",
};

function pocToDraft(p: Poc): PocDraft {
  return {
    full_name: p.full_name,
    role_title: p.role_title ?? "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    ig_handle: p.ig_handle ?? "",
    linkedin_url: p.linkedin_url ?? "",
  };
}

export function BrandPanel({
  outreachId,
  brand,
  pocs,
  primaryPocId,
  otherOutreaches,
}: BrandPanelProps) {
  const router = useRouter();
  const [pocList, setPocList] = useState<Poc[]>(pocs);
  const [linkedPocId, setLinkedPocId] = useState<string | null>(primaryPocId);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!brand) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Brand</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Brand record not found.</p>
        </CardContent>
      </Card>
    );
  }
  const brandId = brand.id;

  function addPoc(draft: PocDraft) {
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
        setPocList((prev) => [...prev, created]);
        setAdding(false);
        toast.success(`Added POC “${created.full_name}”`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function saveEdit(pocId: string, draft: PocDraft) {
    start(async () => {
      try {
        await upsertPoc(brandId, {
          id: pocId,
          full_name: draft.full_name.trim(),
          role_title: draft.role_title.trim() || null,
          email: draft.email.trim() || null,
          phone: draft.phone.trim() || null,
          ig_handle: draft.ig_handle.trim() || null,
          linkedin_url: draft.linkedin_url.trim() || null,
          notes: null,
        });
        setPocList((prev) =>
          prev.map((p) =>
            p.id === pocId
              ? {
                  ...p,
                  full_name: draft.full_name.trim(),
                  role_title: draft.role_title.trim() || null,
                  email: draft.email.trim() || null,
                  phone: draft.phone.trim() || null,
                  ig_handle: draft.ig_handle.trim() || null,
                  linkedin_url: draft.linkedin_url.trim() || null,
                }
              : p,
          ),
        );
        setEditingId(null);
        toast.success("POC updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function setPrimary(pocId: string) {
    const next = pocId === linkedPocId ? null : pocId;
    start(async () => {
      try {
        await updateOutreach(outreachId, { primary_poc_id: next });
        setLinkedPocId(next);
        toast.success(next ? "Primary POC set" : "Primary POC cleared");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <Link href={`/brands/${brand.id}`} className="hover:text-primary">
            {brand.name}
          </Link>
          {brand.industry ? (
            <Badge variant="outline" className="font-normal">
              {brand.industry}
            </Badge>
          ) : null}
        </CardTitle>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {brand.ig_handle ? (
            <a
              href={igUrl(brand.ig_handle)}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              @{normalizeIgHandle(brand.ig_handle)}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {brand.website ? (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              {brand.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          <Link href={`/brands/${brand.id}`} className="hover:text-primary">
            Edit brand details →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* POCs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              POCs ({pocList.length})
            </span>
            {!adding ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setAdding(true);
                }}
              >
                <Plus />
                Add POC
              </Button>
            ) : null}
          </div>

          {adding ? (
            <PocForm
              initial={EMPTY_DRAFT}
              title="Add new POC"
              submitLabel="Add"
              pending={pending}
              onCancel={() => setAdding(false)}
              onSubmit={addPoc}
            />
          ) : null}

          {pocList.length === 0 && !adding ? (
            <p className="text-xs text-muted-foreground">No POCs for this brand yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {pocList.map((p) =>
                editingId === p.id ? (
                  <li key={p.id}>
                    <PocForm
                      initial={pocToDraft(p)}
                      title="Edit POC"
                      submitLabel="Save"
                      pending={pending}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(draft) => saveEdit(p.id, draft)}
                    />
                  </li>
                ) : (
                  <li
                    key={p.id}
                    className={cn(
                      "rounded-md border px-2.5 py-2 text-sm",
                      linkedPocId === p.id
                        ? "border-primary/30 bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{p.full_name}</span>
                          {p.role_title ? (
                            <span className="text-xs text-muted-foreground truncate">
                              {p.role_title}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {p.email ? (
                            <a href={`mailto:${p.email}`} className="hover:text-primary">
                              {p.email}
                            </a>
                          ) : null}
                          {p.phone ? <span>{p.phone}</span> : null}
                          {p.ig_handle ? (
                            <a
                              href={igUrl(p.ig_handle)}
                              target="_blank"
                              rel="noopener"
                              className="hover:text-primary"
                            >
                              @{normalizeIgHandle(p.ig_handle)}
                            </a>
                          ) : null}
                          {p.linkedin_url ? (
                            <a
                              href={p.linkedin_url}
                              target="_blank"
                              rel="noopener"
                              className="hover:text-primary"
                            >
                              LinkedIn
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAdding(false);
                          setEditingId(p.id);
                        }}
                        disabled={pending}
                        title="Edit POC"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrimary(p.id)}
                        disabled={pending}
                        title={
                          linkedPocId === p.id
                            ? "Primary POC for this outreach"
                            : "Set as primary POC for this outreach"
                        }
                        className={cn(
                          "shrink-0 transition-colors",
                          linkedPocId === p.id
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Star
                          className={cn(
                            "h-3.5 w-3.5",
                            linkedPocId === p.id && "fill-current",
                          )}
                        />
                      </button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>

        {/* Other outreaches with this brand */}
        <div className="space-y-2 border-t border-border pt-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Other outreaches with {brand.name} ({otherOutreaches.length})
          </span>
          {otherOutreaches.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              This is the only outreach with this brand.
            </p>
          ) : (
            <ul className="space-y-1">
              {otherOutreaches.map((bo) => (
                <li key={bo.id}>
                  <Link
                    href={`/outreaches/${bo.id}`}
                    className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent"
                  >
                    <span className="truncate flex-1">
                      {bo.talent?.full_name ?? "—"}
                    </span>
                    <StatusPill status={bo.status} />
                    <span className="text-xs text-muted-foreground">
                      {fmtRelative(bo.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PocForm({
  initial,
  title,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial: PocDraft;
  title: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (draft: PocDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<PocDraft>(initial);

  function set<K extends keyof PocDraft>(key: K, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.full_name.trim()) return;
        onSubmit(draft);
      }}
      className="rounded-md border border-border bg-muted/30 p-2.5 space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px]">Full name</Label>
        <Input
          autoFocus
          value={draft.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          required
          className="h-8"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Role</Label>
          <Input
            value={draft.role_title}
            onChange={(e) => set("role_title", e.target.value)}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Phone</Label>
          <Input
            value={draft.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="h-8"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px]">Email</Label>
        <Input
          type="email"
          value={draft.email}
          onChange={(e) => set("email", e.target.value)}
          className="h-8"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">IG handle</Label>
          <Input
            value={draft.ig_handle}
            onChange={(e) => set("ig_handle", e.target.value)}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">LinkedIn URL</Label>
          <Input
            value={draft.linkedin_url}
            onChange={(e) => set("linkedin_url", e.target.value)}
            className="h-8"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || !draft.full_name.trim()}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
