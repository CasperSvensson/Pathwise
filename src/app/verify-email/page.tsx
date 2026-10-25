import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata = { title: "Verify your email" };

/** Visas direkt efter registrering. Länken i mejlet leder till /auth/callback. */
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;

  return (
    <AuthCard title="Check your inbox" subtitle={`We sent a verification link to ${email ?? "your email"}.`}>
      <p className="text-sm text-muted">
        Click the link to activate your account. You&apos;ll come straight back to where you were.
      </p>
      <p className="mt-6 text-sm text-muted">
        Wrong address? <Link href="/signup" className="text-brand">Sign up again</Link>
      </p>
    </AuthCard>
  );
}
