"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCampaign } from "@/server/actions/campaigns";

export function BriefCard({
  campaignId,
  brief,
  deliverableTarget,
  notes,
}: {
  campaignId: string;
  brief: string | null;
  deliverableTarget: string | null;
  notes: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [draft, setDraft] = useState({
    brief: brief ?? "",
    deliverable_target: deliverableTarget ?? "",
    notes: notes ?? "",
  });

  function save() {
    start(async () => {
      try {
        await updateCampaign(campaignId, {
          brief: draft.brief.trim() || null,
          deliverable_target: draft.deliverable_target.trim() || null,
          notes: draft.notes.trim() || null,
        });
        toast.success("Brief updated");
        setEditing(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Brief
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setDraft({
                  brief: brief ?? "",
                  deliverable_target: deliverableTarget ?? "",
                  notes: notes ?? "",
                });
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
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="brief">Brief</Label>
              <Textarea
                id="brief"
                rows={6}
                value={draft.brief}
                onChange={(e) => setDraft({ ...draft, brief: e.target.value })}
                placeholder="What the brand wants — tone, do's and don'ts, hashtags, deadlines."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deliverable_target">Deliverable target</Label>
              <Input
                id="deliverable_target"
                value={draft.deliverable_target}
                onChange={(e) =>
                  setDraft({ ...draft, deliverable_target: e.target.value })
                }
                placeholder="e.g. 30 reels, 50K total reach"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Internal notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={save} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Save
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3 text-sm">
            <Section title="Brief">
              {brief ? (
                <p className="whitespace-pre-wrap">{brief}</p>
              ) : (
                <p className="text-xs text-muted-foreground">No brief captured.</p>
              )}
            </Section>
            <Section title="Deliverable target">
              {deliverableTarget ? (
                <p>{deliverableTarget}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Not set.</p>
              )}
            </Section>
            <Section title="Internal notes">
              {notes ? (
                <p className="whitespace-pre-wrap">{notes}</p>
              ) : (
                <p className="text-xs text-muted-foreground">None.</p>
              )}
            </Section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}
