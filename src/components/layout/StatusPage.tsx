import { Button } from "@/components/ui/Button";

/** 404, åtkomst nekad m.m. – samma utseende. */
export function StatusPage({ code, title }: { code: string; title: string }) {
  return (
    <div className="dot-grid flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="font-mono text-6xl text-highlight">{code}</p>
      <h1 className="max-w-md text-2xl">{title}</h1>
      <Button href="/explore">Go to Explore</Button>
    </div>
  );
}
