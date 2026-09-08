import Link from "next/link";
import { moduleOffTitle } from "@/lib/modules";
import type { ModuleId } from "@/lib/types";

export function ModuleOffState({ moduleId }: { moduleId: ModuleId }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="font-serif text-4xl tracking-tight text-ink">{moduleOffTitle(moduleId)}</h1>
      <p className="mt-3 text-ink-soft">Turn it on in Settings. Songs, plans, events, and rooms stay saved.</p>
      <Link href="/settings" className="btn btn-primary mt-8">
        Open Settings
      </Link>
    </div>
  );
}
