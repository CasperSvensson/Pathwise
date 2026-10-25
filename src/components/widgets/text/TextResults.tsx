import { Stat } from "@/components/widgets/shared/Stat";

/** Lista med all fritext-feedback, nyast först. */
export function TextResults({ texts }: { texts: { text: string; createdAt: string }[] }) {
  return (
    <div className="space-y-3">
      <Stat label="Responses" value={texts.length} />

      {texts.length === 0 && <p className="text-sm text-muted">No feedback yet.</p>}

      <ul className="space-y-2">
        {texts.map((item, i) => (
          <li key={i} className="rounded-lg border border-line bg-raised p-3 text-sm">
            <p>{item.text}</p>
            <p className="mt-1 text-xs text-faint">{new Date(item.createdAt).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
