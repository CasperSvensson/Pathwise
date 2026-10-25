"use client";

import { Button } from "@/components/ui/Button";

/** Visas om något oväntat går fel på servern eller i nätverket. */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="dot-grid flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="font-mono text-highlight">Error</p>
      <h1 className="text-2xl">Something went wrong. Nothing has been lost.</h1>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="ghost">Home</Button>
      </div>
    </div>
  );
}
