import { toggleReminderAction } from "@/lib/actions";

export function ReminderToggle({
  assignmentId,
  reminder,
  planId,
  eventId,
}: {
  assignmentId: string;
  reminder?: boolean;
  planId?: string;
  eventId?: string;
}) {
  return (
    <form action={toggleReminderAction}>
      {planId ? <input type="hidden" name="planId" value={planId} /> : null}
      {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="reminder" value={reminder ? "" : "on"} />
      <button className="btn btn-ghost px-3 py-1.5 text-sm" type="submit">
        {reminder ? "Clear reminder" : "Flag reminder"}
      </button>
    </form>
  );
}
