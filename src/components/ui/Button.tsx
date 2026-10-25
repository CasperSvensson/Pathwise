import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * EN knappkomponent för hela sajten.
 *  - Skicka in `href` → blir en länk.
 *  - Annars → vanlig <button>.
 *
 * Varianter:
 *  primary  – blå/lila gradient, monospace (som "Publish" / "Create new")
 *  ghost    – bara text (som "Explore", "About", "Login")
 *  subtle   – mörk ruta med kant (som zoom-knapparna)
 *  danger   – röd text, för radera
 */

type Variant = "primary" | "ghost" | "subtle" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "brand-gradient text-white font-mono shadow-[0_8px_30px_rgba(79,124,255,0.25)] hover:brightness-110",
  ghost: "text-fg/90 font-mono hover:text-white hover:bg-white/5",
  subtle: "bg-raised border border-line-strong text-fg hover:bg-white/5",
  danger: "text-danger hover:bg-danger/10",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-5 text-[15px] rounded-[10px]",
  lg: "h-14 px-7 text-base rounded-xl",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  href?: string;
  children: ReactNode;
};

export function Button({ variant = "primary", size = "md", href, className, children, ...rest }: Props) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap transition",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
