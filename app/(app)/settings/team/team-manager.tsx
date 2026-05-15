"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Loader2,
  UserPlus,
  KeyRound,
  Crown,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initials, cn } from "@/lib/utils";
import {
  inviteTeammate,
  resetTeammatePassword,
  setAdminCanConfigureTeam,
  updateMemberSidebar,
  updateTeammateRole,
} from "@/server/actions/settings";
import {
  DEFAULT_MEMBER_SIDEBAR,
  SIDEBAR_ITEMS,
  type SidebarKey,
} from "@/lib/permissions";
import type { Profile, UserRole } from "@/lib/supabase/types";

function CredentialsCard({ creds }: { creds: { email: string; password: string } }) {
  const [copied, setCopied] = useState<"all" | "email" | "password" | null>(null);

  async function copy(value: string, kind: "all" | "email" | "password") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied((c) => (c === kind ? null : c)), 1500);
    } catch {
      toast.error("Copy failed — your browser may block clipboard access");
    }
  }

  const combined = `Email: ${creds.email}\nPassword: ${creds.password}`;

  return (
    <div className="rounded-md border border-success/30 bg-success/10 px-3 py-3 text-sm space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-success font-medium">Credentials ready — copy &amp; share</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => copy(combined, "all")}
          className="bg-background"
        >
          {copied === "all" ? <Check /> : <Copy />}
          {copied === "all" ? "Copied" : "Copy both"}
        </Button>
      </div>
      <div className="font-mono text-xs divide-y divide-success/20 rounded-md border border-success/20 bg-background/60">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="truncate">
            <span className="text-muted-foreground">Email:</span> {creds.email}
          </span>
          <button
            type="button"
            onClick={() => copy(creds.email, "email")}
            className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            aria-label="Copy email"
          >
            {copied === "email" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied === "email" ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="truncate">
            <span className="text-muted-foreground">Password:</span> {creds.password}
          </span>
          <button
            type="button"
            onClick={() => copy(creds.password, "password")}
            className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            aria-label="Copy password"
          >
            {copied === "password" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied === "password" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

function generatePassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  for (let i = 0; i < arr.length; i++) out += alphabet[arr[i] % alphabet.length];
  return out;
}

interface Props {
  initial: Profile[];
  currentUserId: string;
  meIsSeedAdmin: boolean;
  meCanConfigure: boolean;
}

export function TeamManager({
  initial,
  currentUserId,
  meIsSeedAdmin,
  meCanConfigure,
}: Props) {
  const [members, setMembers] = useState(initial);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState(() => generatePassword());
  const [role, setRole] = useState<UserRole>("member");
  const [pending, start] = useTransition();
  const [lastCreated, setLastCreated] = useState<{ email: string; password: string } | null>(null);

  function onInvite(e: React.FormEvent) {
    e.preventDefault();
    const pwd = password;
    start(async () => {
      try {
        await inviteTeammate(email.trim(), pwd, role, name.trim() || undefined);
        toast.success(`Created ${email}`);
        setLastCreated({ email: email.trim(), password: pwd });
        // Reload list optimistically; in practice revalidatePath refreshes on next nav.
        setMembers((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            email: email.trim(),
            full_name: name.trim() || email.trim(),
            avatar_url: null,
            role,
            linked_talent_id: null,
            linked_brand_id: null,
            linked_managed_brand_id: null,
            is_seed_admin: false,
            can_configure_team: true,
            allowed_sidebar: null,
            created_at: new Date().toISOString(),
          } as Profile,
        ]);
        setEmail("");
        setName("");
        setRole("member");
        setPassword(generatePassword());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invite failed");
      }
    });
  }

  function onResetPassword(userId: string, userEmail: string | null) {
    const newPwd = generatePassword();
    start(async () => {
      try {
        await resetTeammatePassword(userId, newPwd);
        setLastCreated({ email: userEmail ?? userId, password: newPwd });
        toast.success("Password reset");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Reset failed");
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

  function onToggleSidebar(member: Profile, key: SidebarKey, on: boolean) {
    const current = (member.allowed_sidebar ?? DEFAULT_MEMBER_SIDEBAR) as SidebarKey[];
    const next = on
      ? Array.from(new Set([...current, key]))
      : current.filter((k) => k !== key);
    start(async () => {
      try {
        await updateMemberSidebar(member.id, next);
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, allowed_sidebar: next } : m)),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  function onToggleAdminConfigure(member: Profile, value: boolean) {
    start(async () => {
      try {
        await setAdminCanConfigureTeam(member.id, value);
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, can_configure_team: value } : m)),
        );
        toast.success(value ? "Granted configure access" : "Revoked configure access");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Create teammate */}
      {meCanConfigure ? (
        <form
          onSubmit={onInvite}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <Label htmlFor="invite-password">Initial password</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPassword(generatePassword())}
                >
                  Regen
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Share with the teammate. They can change it from Profile after sign-in.
              </p>
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
          </div>
          <Button type="submit" disabled={pending || !email || password.length < 8}>
            {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
            Create account
          </Button>
        </form>
      ) : (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          You don&apos;t have permission to create teammates. Ask the seed admin to grant it.
        </div>
      )}

      {lastCreated ? <CredentialsCard creds={lastCreated} /> : null}

      {/* Roster */}
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {members.map((m) => {
          const isSelf = m.id === currentUserId;
          const isAdmin = m.role === "admin";
          const allowed = (m.allowed_sidebar ?? DEFAULT_MEMBER_SIDEBAR) as SidebarKey[];
          return (
            <div key={m.id} className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initials(m.full_name ?? m.email)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{m.full_name ?? "—"}</span>
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    ) : null}
                    {m.is_seed_admin ? (
                      <Badge variant="primary" className="inline-flex items-center gap-1">
                        <Crown className="h-3 w-3" /> Seed admin
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                </div>
                <Select
                  value={m.role}
                  onValueChange={(v) => onChangeRole(m.id, v as UserRole)}
                  disabled={isSelf || m.is_seed_admin || !meCanConfigure}
                >
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
                {!isSelf && meCanConfigure ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => onResetPassword(m.id, m.email)}
                  >
                    <KeyRound />
                    Reset password
                  </Button>
                ) : null}
              </div>

              {/* Per-member access controls — same UI for admins and members. */}
              {!isSelf && !m.is_seed_admin ? (
                <div className="ml-10 space-y-3">
                  <div className="space-y-1.5">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Accessible tabs
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SIDEBAR_ITEMS.map((item) => {
                        const on = allowed.includes(item.key);
                        return (
                          <button
                            type="button"
                            key={item.key}
                            disabled={pending || !meCanConfigure}
                            onClick={() => onToggleSidebar(m, item.key, !on)}
                            className={cn(
                              "inline-flex items-center rounded-md border px-2 py-0.5 text-xs transition-colors",
                              on
                                ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                                : "border-border bg-background text-muted-foreground hover:bg-accent",
                            )}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Admin-only: configure-team permission, gated to seed admin. */}
                  {isAdmin ? (
                    meIsSeedAdmin ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          onToggleAdminConfigure(m, !m.can_configure_team)
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
                          m.can_configure_team
                            ? "border-success/30 bg-success/10 text-success hover:bg-success/15"
                            : "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15",
                        )}
                      >
                        {m.can_configure_team ? (
                          <>
                            <ShieldCheck className="h-3 w-3" /> Can configure team
                            — click to revoke
                          </>
                        ) : (
                          <>
                            <ShieldOff className="h-3 w-3" /> Cannot configure team
                            — click to grant
                          </>
                        )}
                      </button>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Admin {m.can_configure_team ? "can" : "cannot"} configure
                        team. Only the seed admin can change this.
                      </p>
                    )
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
