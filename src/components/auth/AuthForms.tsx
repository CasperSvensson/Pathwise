"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, signIn, signInWithGoogle, signUp, updatePassword } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { IDLE, type ActionResult } from "@/lib/types";

/**
 * Alla inloggningsformulär på ett ställe. De är små och delar
 * samma mönster: useActionState + server action + FormMessage.
 */

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(signIn, IDLE);

  return (
    <>
      <GoogleButton next={next} />
      <Divider />
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <TextInput label="Email" name="email" type="email" autoComplete="email" required />
        <TextInput label="Password" name="password" type="password" autoComplete="current-password" required />
        <FormMessage state={state} />
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Logging in…" : "Log in"}</Button>
      </form>
      <div className="mt-6 flex justify-between text-sm text-muted">
        <Link href="/forgot-password" className="hover:text-fg">Forgot password?</Link>
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-brand">Create account</Link>
      </div>
    </>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(signUp, IDLE);

  return (
    <>
      <GoogleButton next={next} />
      <Divider />
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <TextInput label="Name" name="name" autoComplete="name" />
        <TextInput label="Email" name="email" type="email" autoComplete="email" required />
        <TextInput label="Password" name="password" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters" />
        <FormMessage state={state} />
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Creating account…" : "Create account"}</Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand">Log in</Link>
      </p>
    </>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(requestPasswordReset, IDLE);

  return (
    <form action={action} className="space-y-4">
      <TextInput label="Email" name="email" type="email" required />
      <FormMessage state={state} successText="If the email has an account, a reset link is on its way." />
      <Button type="submit" className="w-full" disabled={pending}>Send reset link</Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(updatePassword, IDLE);

  return (
    <form action={action} className="space-y-4">
      <TextInput label="New password" name="password" type="password" minLength={8} required autoComplete="new-password" />
      <FormMessage state={state} />
      <Button type="submit" className="w-full" disabled={pending}>Save password</Button>
    </form>
  );
}

function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <Button type="submit" variant="subtle" className="w-full">Continue with Google</Button>
    </form>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-faint">
      <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
    </div>
  );
}
