import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/calendar-view";
import { getSession } from "@/lib/auth";
import { todayISO } from "@/lib/format";
import { readStore } from "@/lib/store";
import type { CalendarEvent, CalendarPlan } from "@/lib/calendar";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  const person = store.people.find((entry) => entry.userId === session.id);

  const plans: CalendarPlan[] = store.plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    date: plan.date,
    serviceTime: plan.serviceTime,
    assigned: person ? plan.assignments.some((row) => row.personId === person.id) : false,
  }));

  const events: CalendarEvent[] = [];

  return (
    <CalendarView
      plans={plans}
      events={events}
      today={todayISO()}
      canCreate={session.role === "director"}
    />
  );
}
