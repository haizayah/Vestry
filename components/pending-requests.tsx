import Link from "next/link";
import { AssignmentResponse, AssignmentStatusChip } from "@/components/assignment-response";
import { ConflictChip } from "@/components/conflict-chip";
import { formatShortDate } from "@/lib/format";
import type { ScheduleRow } from "@/lib/schedule";

export function PendingRequests({
  rows,
  viewerPersonId,
  isDirector,
  title = "Pending requests",
  empty,
  compact = false,
}: {
  rows: ScheduleRow[];
  viewerPersonId?: string;
  isDirector: boolean;
  title?: string;
  empty?: string;
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return empty ? <p className="text-ink-soft">{empty}</p> : null;
  }

  return (
    <section>
      {compact ? (
        <>
          <p className="field-label">Needs a reply</p>
          <h3 className="font-serif text-2xl tracking-tight text-ink">{title}</h3>
        </>
      ) : (
        <>
          <p className="field-label">Needs a reply</p>
          <h2 className="font-serif text-3xl tracking-tight text-ink">{title}</h2>
        </>
      )}
      <ul className="mt-4 space-y-3">
        {rows.map((row) => {
          const canRespond = isDirector || row.assignment.personId === viewerPersonId;
          return (
            <li key={row.key} className="paper-card rounded-3xl px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={row.href} className="font-serif text-xl text-wine-deep underline-offset-4 hover:underline">
                    {row.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {row.personName} · {row.assignment.position} · {formatShortDate(row.date)} · {row.time}
                    {row.location ? ` · ${row.location}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {row.conflicts.length > 0 ? (
                    <ConflictChip
                      tooltip={row.conflicts
                        .map((conflict) =>
                          conflict.note
                            ? `${conflict.personName}: ${conflict.range} — ${conflict.note}`
                            : `${conflict.personName}: ${conflict.range}`,
                        )
                        .join(" · ")}
                    />
                  ) : null}
                  <AssignmentStatusChip status={row.assignment.status} />
                </div>
              </div>
              {canRespond ? (
                <div className="mt-3">
                  <AssignmentResponse
                    assignmentId={row.assignment.id}
                    status={row.assignment.status}
                    planId={row.planId}
                    eventId={row.eventId}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
