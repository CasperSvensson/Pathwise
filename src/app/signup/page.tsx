import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/AuthForms";
import { safeNextPath } from "@/lib/utils";

export const metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <AuthCard title="Create account" subtitle="Free – follow companies, vote and share ideas.">
      <SignupForm next={safeNextPath(next)} />
    </AuthCard>
  );
}
