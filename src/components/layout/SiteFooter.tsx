import Link from "next/link";
import { SITE } from "@/lib/site";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/explore", label: "Explore" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="mx-4 mt-24 flex flex-col items-center justify-between gap-4 border-t border-line py-8 font-mono text-sm text-faint md:mx-12 md:flex-row">
      <span>© {new Date().getFullYear()} {SITE.name}</span>
      <nav className="flex flex-wrap gap-6">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-fg">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
