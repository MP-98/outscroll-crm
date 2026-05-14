"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR, commission } from "@/lib/currency";
import { fmtDate } from "@/lib/date";
import { updateOutreach } from "@/server/actions/outreaches";
import type { OutreachDirection } from "@/lib/supabase/types";

export interface DealTerms {
  deliverables: string | null;
  proposed_amount: number | null;
  negotiated_amount: number | null;
  agreed_amount: number | null;
  commission_pct: number | null;
  direction: OutreachDirection | null;
  reached_out_at: string | null;
  next_followup_at: string;
  paid_at: string | null;
  lost_reason: string | null;
}

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function DealTermsCard({
  outreachId,
  terms,
  defaultCommissionPct,
}: {
  outreachId: string;
  terms: DealTerms;
  defaultCommissionPct: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [draft, setDraft] = useState<DealTerms>(terms);

  const effectivePct = terms.commission_pct ?? defaultCommissionPct ?? 20;
  const commissionAmt = commission(terms.agreed_amount, effectivePct);

  function set<K extends keyof DealTerms>(key: K, value: DealTerms[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function cancel() {
    setDraft(terms);
    setEditing(false);
  }

  function save() {
    if (!draft.next_followup_at) {
      toast.error("Follow-up date is required");
      return;
    }
    start(async () => {
      try {
        await updateOutreach(outreachId, {
          deliverables: draft.deliverables,
          proposed_amount: draft.proposed_amount,
          negotiated_amount: draft.negotiated_amount,
          agreed_amount: draft.agreed_amount,
          commission_pct: draft.commission_pct,
          direction: draft.direction ?? "outbound",
          reached_out_at: draft.reached_out_at,
          next_followup_at: draft.next_followup_at,
          paid_at: draft.paid_at,
          lost_reason: draft.lost_reason,
        });
        toast.success("Deal terms updated");
        setEditing(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Deal terms
          {editing ? (
            <button
              type="button"
              onClick={cancel}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Edit deal terms"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {editing ? (
          <div className="space-y-3">
            <Field label="Deliverables">
              <Textarea
                rows={2}
                value={draft.deliverables ?? ""}
                onChange={(e) => set("deliverables", e.target.value || null)}
              />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Proposed ₹">
                <Input
                  type="number"
                  value={draft.proposed_amount ?? ""}
                  onChange={(e) => set("proposed_amount", numOrNull(e.target.value))}
                />
              </Field>
              <Field label="Negotiated ₹">
                <Input
                  type="number"
                  value={draft.negotiated_amount ?? ""}
                  onChange={(e) => set("negotiated_amount", numOrNull(e.target.value))}
                />
              </Field>
              <Field label="Agreed ₹">
                <Input
                  type="number"
                  value={draft.agreed_amount ?? ""}
                  onChange={(e) => set("agreed_amount", numOrNull(e.target.value))}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Commission %">
                <Input
                  type="number"
                  step="0.5"
                  value={draft.commission_pct ?? ""}
                  onChange={(e) => set("commission_pct", numOrNull(e.target.value))}
                />
              </Field>
              <Field label="Direction">
                <Select
                  value={draft.direction ?? "outbound"}
                  onValueChange={(v) => set("direction", v as OutreachDirection)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Reached out">
                <Input
                  type="date"
                  value={draft.reached_out_at ?? ""}
                  onChange={(e) => set("reached_out_at", e.target.value || null)}
                />
              </Field>
              <Field label="Next follow-up">
                <Input
                  type="date"
                  value={draft.next_followup_at ?? ""}
                  onChange={(e) => set("next_followup_at", e.target.value)}
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Paid on">
                <Input
                  type="date"
                  value={draft.paid_at ?? ""}
                  onChange={(e) => set("paid_at", e.target.value || null)}
                />
              </Field>
              <Field label="Lost reason">
                <Input
                  value={draft.lost_reason ?? ""}
                  onChange={(e) => set("lost_reason", e.target.value || null)}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" size="sm" variant="ghost" onClick={cancel}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={save} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Detail label="Deliverables" value={terms.deliverables ?? "—"} multiline />
            <Detail label="Proposed" value={formatINR(terms.proposed_amount)} />
            <Detail label="Negotiated" value={formatINR(terms.negotiated_amount)} />
            <Detail label="Agreed" value={formatINR(terms.agreed_amount)} />
            <Detail
              label="Commission %"
              value={effectivePct ? `${effectivePct}%` : "—"}
            />
            <Detail label="Commission ₹" value={formatINR(commissionAmt)} />
            <Detail
              label="Direction"
              value={
                terms.direction
                  ? terms.direction.charAt(0).toUpperCase() + terms.direction.slice(1)
                  : "—"
              }
            />
            <Detail
              label="Reached out"
              value={terms.reached_out_at ? fmtDate(terms.reached_out_at) : "—"}
            />
            <Detail label="Next follow-up" value={fmtDate(terms.next_followup_at)} />
            {terms.paid_at ? (
              <Detail label="Paid" value={fmtDate(terms.paid_at)} />
            ) : null}
            {terms.lost_reason ? (
              <Detail label="Lost reason" value={terms.lost_reason} />
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px]">{label}</Label>
      {children}
    </div>
  );
}

function Detail({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "space-y-0.5" : "flex justify-between gap-3"}>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={multiline ? "text-sm" : "text-sm text-right"}>{value}</span>
    </div>
  );
}
