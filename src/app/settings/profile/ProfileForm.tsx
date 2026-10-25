"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/Button";
import { Select, TextInput } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { IDLE, type ActionResult } from "@/lib/types";

export function ProfileForm({ displayName, locale }: { displayName: string; locale: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(updateProfile, IDLE);

  return (
    <form action={action} className="max-w-lg space-y-5">
      <TextInput label="Display name" name="display_name" defaultValue={displayName} required maxLength={60} />
      <Select label="Language" name="locale" defaultValue={locale}>
        <option value="en">English</option>
        <option value="sv">Svenska</option>
      </Select>
      <FormMessage state={state} successText="Saved." />
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}
