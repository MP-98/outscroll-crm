"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initials } from "@/lib/utils";
import { inviteTeammate, updateTeammateRole } from "@/server/actions/settings";
import type { Profile, UserRole } from "@/lib/supabase/types";

export function TeamManager({
  initial,
  currentUserId,
}: {
  initial: Profile[];
  currentUserId: string;
}) {
  const [members, setMembers] = useState(initial);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [pending, start] = useTransition();

  function onInvite(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      try {
        await inviteTeammate(email.trim(), role, name.trim() || undefined);
        toast.success(`Invited ${email}`);
        setEmail("");
        setName("");
        setRole("member");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invite failed");
      }
    });
  }

  function onChangeRole(userId: string, newRole: UserRole) {
    start(async () => {
      try {
        await updateTeammateRole(userId, newRole);
        setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
        toast.success("Role updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onInvite} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_140px_auto] gap-2 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="teammate@theproductfolks.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-name">Name</Label>
          <Input
            id="invite-name"
            placeholder="Optional"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending || !email}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          Invite
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
            <Avatar>
              <AvatarFallback>{initials(m.full_name ?? m.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                {m.full_name ?? "—"} {m.id === currentUserId ? <span className="text-xs text-muted-foreground">(you)</span> : null}
              </div>
              <div className="text-xs text-muted-foreground truncate">{m.email}</div>
            </div>
            <Select value={m.role} onValueChange={(v) => onChangeRole(m.id, v as UserRole)} disabled={m.id === currentUserId}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="talent">Talent</SelectItem>
                <SelectItem value="brand">Brand</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
