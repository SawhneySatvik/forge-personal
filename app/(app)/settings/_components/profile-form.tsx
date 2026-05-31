"use client";

import { useActionState, useEffect } from "react";
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
                defaultValue={initial?.display_name ?? ""}
                placeholder="Satvik"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select
                name="timezone"
                defaultValue={initial?.timezone ?? "Asia/Kolkata"}
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
                defaultValue={initial?.github_username ?? ""}
                placeholder="octocat"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leetcode_username">LeetCode username</Label>
              <Input
                id="leetcode_username"
                name="leetcode_username"
                defaultValue={initial?.leetcode_username ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                type="url"
                defaultValue={initial?.linkedin_url ?? ""}
                placeholder="https://linkedin.com/in/…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="x_handle">X handle</Label>
              <Input
                id="x_handle"
                name="x_handle"
                defaultValue={initial?.x_handle ?? ""}
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
