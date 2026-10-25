import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Logotyp-rutan:  [ikon]  Pathwise
 *                         (undertitel)
 * Används i sidhuvudet och på inloggningssidorna.
 */
export function BrandBadge({ title, subtitle, href = "/" }: { title: string; subtitle?: string; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#5a5a5a] to-[#3a3a3a] text-white">
        <Icon name="logo" size={26} strokeWidth={1.5} />
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-semibold text-white">{title}</span>
        {subtitle && <span className="block text-sm font-semibold text-muted">{subtitle}</span>}
      </span>
    </Link>
  );
}
