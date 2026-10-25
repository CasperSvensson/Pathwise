import { Panel } from "@xyflow/react";

/** Kortkommandon nere till vänster (döljs på mobil). */
export function KeyboardHints({ editable }: { editable: boolean }) {
  const hints = [
    { key: "␣", label: "pan" },
    ...(editable ? [{ key: "⌫", label: "delete" }] : []),
    { key: "scroll", label: "zoom" },
  ];

  return (
    <Panel position="bottom-left" className="!m-6 hidden items-center gap-8 md:flex">
      {hints.map((hint) => (
        <span key={hint.label} className="flex items-center gap-3 font-mono text-lg text-faint">
          <kbd className="rounded-md border border-line-strong px-3 py-0.5 font-mono text-base">{hint.key}</kbd>
          {hint.label}
        </span>
      ))}
    </Panel>
  );
}
