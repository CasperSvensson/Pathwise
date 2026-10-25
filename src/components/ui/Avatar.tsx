import { cn } from "@/lib/utils";

/** Rund profilbild. Utan bild visas första bokstaven i namnet. */
export function Avatar({ src, name, size = 40, className }: { src?: string | null; name?: string | null; size?: number; className?: string }) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase();

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e9e9e9] font-semibold text-[#333]", className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
