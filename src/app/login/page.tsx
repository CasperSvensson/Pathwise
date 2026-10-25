import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/AuthForms";
import { safeNextPath } from "@/lib/utils";

export const metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  link_expired: "The link has expired or was already used. Log in or request a new one.",
  oauth: "Google sign-in failed. Try again.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;

  return (
    <AuthCard title="Log in" subtitle="Welcome back.">
      {error && ERRORS[error] && <p className="mb-4 text-sm text-danger">{ERRORS[error]}</p>}
      <LoginForm next={safeNextPath(next)} />
    </AuthCard>
  );
}
