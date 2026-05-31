"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addSystemDesignTopic } from "../actions";

export function AddTopicForm() {
  const [state, formAction, pending] = useActionState(addSystemDesignTopic, null);

  useEffect(() => {
    if (state?.ok) toast.success("Topic added.");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  // Remount to clear the input after each successful add.
  const key = state?.ok && state.id ? state.id : "new";

  return (
    <form key={key} action={formAction} className="flex gap-2">
      <Input
        name="name"
        required
        placeholder="Add a topic — e.g. Rate limiting, Consistent hashing…"
        className="max-w-md"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
