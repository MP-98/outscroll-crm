"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, X, Loader2 } from "lucide-react";
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
import { formatINR } from "@/lib/currency";
import { fmtDate } from "@/lib/date";
import { updateCampaignOutreach } from "@/server/actions/campaign-outreaches";
import type { CampaignPaymentStatus } from "@/lib/supabase/types";

export interface TermsState {
  deliverables: string | null;
  proposed_amount: number | null;
  agreed_amount: number | null;
  next_followup_at: string | null;
  payment_status: CampaignPaymentStatus;
  paid_on: string | null;
  deliverable_done: boolean;
}

const PAYMENT_STATUSES: CampaignPaymentStatus[] = [
  "pending",
  "invoiced",
  "paid",
  "overdue",
  "na",
];

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function TermsCard({
  outreachId,
  terms,
}: {
  outreachId: string;
  terms: TermsState;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [draft, setDraft] = useState<TermsState>(terms);

  function set<K extends keyof TermsState>(k: K, v: TermsState[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function save() {
    start(async () => {
      try {
        await updateCampaignOutreach(outreachId, {
          deliverables: draft.deliverables,
          proposed_amount: draft.proposed_amount,
          agreed_amount: draft.agreed_amount,
          next_followup_at: draft.next_followup_at,
          payment_status: draft.payment_status,
          paid_on: draft.paid_on,
          deliverable_done: draft.deliverable_done,
        });
        toast.success("Terms updated");
        setEditing(false);
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
          Deal terms
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setDraft(terms);
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
      <CardContent className="space-y-2 text-sm">
        {editing ? (
          <div className="space-y-3">
            <Field label="Deliverables">
              <Textarea
                rows={2}
                value={draft.deliverables ?? ""}
                onChange={(e) => set("deliverables", e.target.value || null)}
                placeholder="What this influencer commits to"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Proposed ₹">
                <Input
                  type="number"
                  value={draft.proposed_amount ?? ""}
                  onChange={(e) => set("proposed_amount", numOrNull(e.target.value))}
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
            <Field label="Next follow-up">
              <Input
                type="date"
                value={draft.next_followup_at ?? ""}
                onChange={(e) => set("next_followup_at", e.target.value || null)}
                disabled={draft.next_followup_at === null}
              />
              <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={draft.next_followup_at === null}
                  onChange={(e) =>
                    set(
                      "next_followup_at",
                      e.target.checked
                        ? null
                        : new Date().toISOString().slice(0, 10),
                    )
                  }
                  className="h-3 w-3"
                />
                No follow-up needed
              </label>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Payment status">
                <Select
                  value={draft.payment_status}
                  onValueChange={(v) =>
                    set("payment_status", v as CampaignPaymentStatus)
                  }
                >
                  <SelectTrigger className="capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Paid on">
                <Input
                  type="date"
                  value={draft.paid_on ?? ""}
                  onChange={(e) => set("paid_on", e.target.value || null)}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.deliverable_done}
                onChange={(e) => set("deliverable_done", e.target.checked)}
                className="h-4 w-4"
              />
              Deliverable complete
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(terms);
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
        ) : (
          <>
            <Detail label="Deliverables" value={terms.deliverables ?? "—"} multiline />
            <Detail label="Proposed" value={formatINR(terms.proposed_amount)} />
            <Detail label="Agreed" value={formatINR(terms.agreed_amount)} />
            <Detail
              label="Next follow-up"
              value={terms.next_followup_at ? fmtDate(terms.next_followup_at) : "—"}
            />
            <Detail
              label="Payment"
              value={terms.payment_status.charAt(0).toUpperCase() +
                terms.payment_status.slice(1)}
            />
            {terms.paid_on ? (
              <Detail label="Paid on" value={fmtDate(terms.paid_on)} />
            ) : null}
            <Detail
              label="Deliverable"
              value={terms.deliverable_done ? "Done" : "Pending"}
            />
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
