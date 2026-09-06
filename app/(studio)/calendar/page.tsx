import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/calendar-view";
import { getSession } from "@/lib/auth";
import { todayISO } from "@/lib/format";
import { loadCalendarPlans } from "@/lib/lockout-api";
import type { CalendarEvent } from "@/lib/calendar";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const events: CalendarEvent[] = [];

  return (
    <CalendarView
      plans={await loadCalendarPlans()}
      events={events}
      today={todayISO()}
      canCreate={session.role === "director"}
    />
  );
}
