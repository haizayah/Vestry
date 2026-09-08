import { respondAssignmentAction, respondEventAssignmentAction } from "@/lib/actions";
import type { AssignmentStatus } from "@/lib/types";

export function AssignmentStatusChip({ status }: { status: AssignmentStatus }) {
  return (
    <span
      className={`chip ${
        status === "accepted" ? "border-good/30 text-good" : status === "declined" ? "border-rose/30 text-rose" : ""
      }`}
    >
      {status}
    </span>
  );
}

export function AssignmentResponse({
  assignmentId,
  status,
  planId,
  eventId,
}: {
  assignmentId: string;
  status: AssignmentStatus;
  planId?: string;
  eventId?: string;
}) {
  const action = eventId ? respondEventAssignmentAction : respondAssignmentAction;
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "accepted" ? (
        <form action={action}>
          {planId ? <input type="hidden" name="planId" value={planId} /> : null}
          {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="status" value="accepted" />
          <button className="btn btn-primary px-3 py-1.5 text-sm" type="submit">
            Accept
          </button>
        </form>
      ) : null}
      {status !== "declined" ? (
        <form action={action}>
          {planId ? <input type="hidden" name="planId" value={planId} /> : null}
          {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="status" value="declined" />
          <button className="btn btn-ghost px-3 py-1.5 text-sm" type="submit">
            Decline
          </button>
        </form>
      ) : null}
    </div>
  );
}
