import Link from "next/link";
import { ACTIVITY_LABELS } from "@/lib/activity";
import { formatStamp } from "@/lib/format";
import type { ActivityItem } from "@/lib/types";

export function ActivityList({
  items,
  empty = "No activity yet.",
}: {
  items: ActivityItem[];
  empty?: string;
}) {
  if (items.length === 0) {
    return <p className="text-ink-soft">{empty}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const inner = (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">{ACTIVITY_LABELS[item.kind]}</span>
              <span className="text-sm text-muted">{formatStamp(item.createdAt)}</span>
            </div>
            <p className="mt-2 font-serif text-xl text-wine-deep">{item.summary}</p>
          </>
        );
        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className="paper-card block rounded-3xl px-5 py-4 transition hover:-translate-y-0.5">
                {inner}
              </Link>
            ) : (
              <div className="paper-card rounded-3xl px-5 py-4">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
