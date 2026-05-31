"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIMEZONES } from "@/lib/timezones";
import type { Profile } from "@/lib/types";
import { updateProfile } from "../actions";

export function ProfileForm({ initial }: { initial: Profile | null }) {
  const [state, formAction, pending] = useActionState(updateProfile, null);

  // Controlled so the fields don't warn when the server re-renders with new
  // initial data after a save.
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [timezone, setTimezone] = useState(initial?.timezone ?? "Asia/Kolkata");
  const [github, setGithub] = useState(initial?.github_username ?? "");
  const [leetcode, setLeetcode] = useState(initial?.leetcode_username ?? "");
  const [linkedin, setLinkedin] = useState(initial?.linkedin_url ?? "");
  const [xHandle, setXHandle] = useState(initial?.x_handle ?? "");

  useEffect(() => {
    if (state?.ok) toast.success("Profile saved.");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Your display name, timezone (used to resolve &ldquo;today&rdquo;), and
          linked accounts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="display_name">Display name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Satvik"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select
                name="timezone"
                value={timezone}
                onValueChange={(v) => setTimezone(v ?? "Asia/Kolkata")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="github_username">GitHub username</Label>
              <Input
                id="github_username"
                name="github_username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="octocat"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leetcode_username">LeetCode username</Label>
              <Input
                id="leetcode_username"
                name="leetcode_username"
                value={leetcode}
                onChange={(e) => setLeetcode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="x_handle">X handle</Label>
              <Input
                id="x_handle"
                name="x_handle"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
                placeholder="@you"
              />
            </div>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
