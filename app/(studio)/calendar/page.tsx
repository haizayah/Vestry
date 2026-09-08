import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/calendar-view";
import { IcalSubscribe } from "@/components/ical-subscribe";
import { getSession } from "@/lib/auth";
import { todayISO } from "@/lib/format";
import { icalFeedPath } from "@/lib/ical";
import { loadCalendarEvents, loadCalendarPlans } from "@/lib/lockout-api";
import { hasModule } from "@/lib/modules";
import { requestOrigin } from "@/lib/origin";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  const worshipOn = hasModule(store.modules, "worship");
  const eventsOn = hasModule(store.modules, "events");
  const params = await searchParams;

  const feedUrl = `${await requestOrigin()}${icalFeedPath(store.icalToken)}`;

  return (
    <div>
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
      <section className="mx-auto mt-8 max-w-6xl paper-card space-y-3 rounded-3xl p-6">
        <p className="field-label">Subscribe</p>
        <h2 className="font-serif text-2xl text-wine-deep">iCal feed</h2>
        <IcalSubscribe url={feedUrl} />
      </section>
    </div>
  );
}
