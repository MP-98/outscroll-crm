"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateProfile } from "@/server/actions/settings";

export function ProfileForm({
  initial,
}: {
  initial: { full_name: string; email: string; avatar_url: string | null; role: string };
}) {
  const [name, setName] = useState(initial.full_name);
  const [avatar, setAvatar] = useState(initial.avatar_url ?? "");
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      try {
        await updateProfile({
          full_name: name,
          avatar_url: avatar.trim() || null,
        });
        toast.success("Profile updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={initial.email} readOnly disabled />
        <p className="text-[11px] text-muted-foreground">
          Email is fixed to your sign-in identity.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input
          id="avatar_url"
          placeholder="https://…"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Label className="text-xs text-muted-foreground normal-case tracking-normal">Role</Label>
        <Badge variant="primary" className="capitalize">
          {initial.role}
        </Badge>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}
