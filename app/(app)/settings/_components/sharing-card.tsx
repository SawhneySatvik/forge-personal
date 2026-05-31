"use client";

import { useActionState, useEffect, useState } from "react";
import { Globe, Link2, Lock } from "lucide-react";
import { toast } from "sonner";
import { setChallengePublic } from "@/app/(app)/challenges/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePublicProfile } from "../actions";

export interface ShareChallenge {
  id: string;
  name: string;
  is_public: boolean;
}

function siteBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "")
  );
}

export function SharingCard({
  handle,
  bio,
  isPublic,
  challenges,
}: {
  handle: string | null;
  bio: string | null;
  isPublic: boolean;
  challenges: ShareChallenge[];
}) {
  const [state, formAction, pending] = useActionState(updatePublicProfile, null);

  const [handleVal, setHandleVal] = useState(handle ?? "");
  const [bioVal, setBioVal] = useState(bio ?? "");

  useEffect(() => {
    if (state?.ok) toast.success("Sharing settings saved.");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public sharing</CardTitle>
        <CardDescription>
          Make a profile page at <code>/u/your-handle</code> and choose which
          challenges anyone can view. Off by default.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="public_handle">Public handle</Label>
              <Input
                id="public_handle"
                name="public_handle"
                value={handleVal}
                onChange={(e) => setHandleVal(e.target.value)}
                placeholder="satvik"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="is_public" defaultChecked={isPublic} />
                Make my profile public
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="public_bio">Bio</Label>
            <Textarea
              id="public_bio"
              name="public_bio"
              rows={2}
              value={bioVal}
              onChange={(e) => setBioVal(e.target.value)}
              placeholder="Grinding the SDE sheet…"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save sharing"}
            </Button>
            {isPublic && handle ? (
              <a
                href={`${siteBase()}/u/${handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
              >
                <Globe className="size-4" /> /u/{handle}
              </a>
            ) : null}
          </div>
        </form>

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Challenges</p>
          {challenges.length === 0 ? (
            <p className="text-muted-foreground text-sm">No challenges yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {challenges.map((c) => (
                <ChallengeShareRow key={c.id} challenge={c} />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChallengeShareRow({ challenge }: { challenge: ShareChallenge }) {
  const [isPublic, setIsPublic] = useState(challenge.is_public);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !isPublic;
    setIsPublic(next);
    setPending(true);
    const res = await setChallengePublic(challenge.id, next);
    setPending(false);
    if (!res.ok) {
      setIsPublic(!next);
      toast.error(res.error);
    } else {
      toast.success(next ? "Now public." : "Now private.");
    }
  }

  function copyLink() {
    void navigator.clipboard
      .writeText(`${siteBase()}/share/c/${challenge.id}`)
      .then(() => toast.success("Share link copied."));
  }

  return (
    <li className="flex items-center justify-between gap-3 p-3">
      <span className="min-w-0 truncate text-sm">{challenge.name}</span>
      <div className="flex shrink-0 items-center gap-2">
        {isPublic ? (
          <Button variant="ghost" size="sm" onClick={copyLink}>
            <Link2 className="size-4" />
          </Button>
        ) : null}
        <Button
          variant={isPublic ? "default" : "outline"}
          size="sm"
          onClick={toggle}
          disabled={pending}
        >
          {isPublic ? <Globe className="size-4" /> : <Lock className="size-4" />}
          {isPublic ? "Public" : "Private"}
        </Button>
      </div>
    </li>
  );
}
