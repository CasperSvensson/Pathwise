import Link from "next/link";
import { signOut } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/layout/PageShell";

const SECTIONS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/company", label: "Company page" },
  { href: "/settings/subscription", label: "Subscription & billing" },
];

/** Gemensam ram för alla inställningssidor: meny till vänster. */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/settings/profile");

  return (
    <PageShell>
      <div className="grid gap-10 md:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 font-mono text-sm text-muted hover:bg-white/5 hover:text-fg"
            >
              {section.label}
            </Link>
          ))}
          <form action={signOut}>
            <button className="whitespace-nowrap rounded-lg px-3 py-2 font-mono text-sm text-danger hover:bg-danger/10">
              Log out
            </button>
          </form>
        </nav>

        <div>{children}</div>
      </div>
    </PageShell>
  );
}
