import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/calendar-view";
import { getSession } from "@/lib/auth";
import { todayISO } from "@/lib/format";
import { loadCalendarEvents, loadCalendarPlans } from "@/lib/lockout-api";
import { hasModule } from "@/lib/modules";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  const worshipOn = hasModule(store.modules, "worship");
  const eventsOn = hasModule(store.modules, "events");
  const params = await searchParams;

  return (
    <CalendarView
      plans={worshipOn ? await loadCalendarPlans() : []}
      events={eventsOn ? await loadCalendarEvents() : []}
      today={todayISO()}
      canCreate={session.role === "director" && worshipOn}
      canCreateEvent={session.role === "director" && eventsOn}
      showPlanFilter={worshipOn}
      showEventFilter={eventsOn}
      openNewEvent={params.new === "event" && session.role === "director" && eventsOn}
    />
  );
}
