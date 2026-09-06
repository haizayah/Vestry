"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  WEEKDAYS,
  WEEKDAYS_NARROW,
  WEEK_HOURS,
  addDaysISO,
  addMonthsISO,
  formatHourLabel,
  formatMonthTitle,
  formatWeekTitle,
  inRange,
  monthGrid,
  parseServiceHour,
  sameMonth,
  weekDays,
  type CalendarEvent,
  type CalendarPlan,
} from "@/lib/calendar";
import { formatPlanDate } from "@/lib/format";

type View = "month" | "week";

type Filters = {
  plans: boolean;
  events: boolean;
  assignments: boolean;
};

const DEFAULT_FILTERS: Filters = { plans: true, events: true, assignments: false };

export function CalendarView({
  plans,
  events,
  today,
  canCreate,
}: {
  plans: CalendarPlan[];
  events: CalendarEvent[];
  today: string;
  canCreate: boolean;
}) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(today);
  const [selected, setSelected] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const visiblePlans = useMemo(
    () =>
      plans.filter((plan) => {
        if (filters.assignments) return plan.assigned;
        return filters.plans;
      }),
    [filters.assignments, filters.plans, plans],
  );
  const visibleEvents = useMemo(() => (filters.events ? events : []), [events, filters.events]);

  const range = useMemo(() => {
    if (view === "week") {
      const days = weekDays(cursor);
      return { start: days[0], end: days[6], days };
    }
    const days = monthGrid(cursor);
    const monthKey = cursor.slice(0, 7);
    const inMonth = days.filter((iso) => iso.startsWith(monthKey));
    return { start: inMonth[0], end: inMonth[inMonth.length - 1], days };
  }, [cursor, view]);

  const plansInRange = visiblePlans.filter((plan) => inRange(plan.date, range.start, range.end));
  const eventsInRange = visibleEvents.filter((event) => inRange(event.date, range.start, range.end));
  const emptyRange = plansInRange.length === 0 && eventsInRange.length === 0;

  const selectedPlans = selected ? visiblePlans.filter((plan) => plan.date === selected) : [];
  const selectedEvents = selected ? visibleEvents.filter((event) => event.date === selected) : [];

  useEffect(() => {
    if (!selected) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  function goToday() {
    setCursor(today);
    setSelected(today);
  }

  function shift(delta: number) {
    setCursor((current) => (view === "month" ? addMonthsISO(current, delta) : addDaysISO(current, delta * 7)));
  }

  function toggleFilter(key: keyof Filters) {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  }

  const emptyCopy =
    view === "week"
      ? "No services this week — create a plan to see it here."
      : "No services this month — create a plan to see it here.";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">Harbor Sundays</p>
          <h1 className="font-serif text-4xl tracking-tight md:text-5xl">Calendar</h1>
        </div>
        {canCreate ? (
          <Link href="/plans/new" className="btn btn-primary">
            New plan
          </Link>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div
          className="inline-flex w-fit rounded-full border border-line bg-card p-1"
          role="tablist"
          aria-label="Calendar view"
        >
          {(["month", "week"] as const).map((option) => {
            const active = view === option;
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={active}
                className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${
                  active ? "bg-wine text-on-deep" : "text-ink-soft hover:text-ink"
                }`}
                onClick={() => {
                  setView(option);
                  if (option === "week" && selected) setCursor(selected);
                }}
              >
                {option === "month" ? "Month" : "Week"}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ghost px-3 py-1.5 text-sm" onClick={() => shift(-1)} aria-label="Previous">
            ‹
          </button>
          <p className="min-w-[10.5rem] text-center font-serif text-xl tracking-tight sm:min-w-[14rem] sm:text-2xl">
            {view === "month" ? formatMonthTitle(cursor) : formatWeekTitle(cursor)}
          </p>
          <button type="button" className="btn btn-ghost px-3 py-1.5 text-sm" onClick={() => shift(1)} aria-label="Next">
            ›
          </button>
          <button type="button" className="btn btn-ghost px-3 py-1.5 text-sm" onClick={goToday}>
            Today
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Filters">
        <FilterChip label="Plans" pressed={filters.plans} onToggle={() => toggleFilter("plans")} />
        <FilterChip label="Events" pressed={filters.events} onToggle={() => toggleFilter("events")} />
        <FilterChip label="My assignments" pressed={filters.assignments} onToggle={() => toggleFilter("assignments")} />
      </div>

      {emptyRange ? (
        <p className="mt-5 text-ink-soft">
          {canCreate ? (
            <>
              {view === "week" ? "No services this week — " : "No services this month — "}
              <Link href="/plans/new" className="text-wine underline-offset-4 hover:underline">
                create a plan
              </Link>{" "}
              to see it here.
            </>
          ) : (
            emptyCopy
          )}
        </p>
      ) : null}

      <div
        className={`mt-5 grid gap-6 ${
          selected ? "md:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]" : ""
        }`}
      >
        {view === "month" ? (
          <MonthGrid
            days={range.days}
            cursor={cursor}
            today={today}
            selected={selected}
            plans={visiblePlans}
            events={visibleEvents}
            onSelect={setSelected}
          />
        ) : (
          <WeekGrid
            days={range.days}
            today={today}
            selected={selected}
            plans={visiblePlans}
            events={visibleEvents}
            onSelect={setSelected}
          />
        )}

        {selected ? (
          <DayPanel
            date={selected}
            plans={selectedPlans}
            events={selectedEvents}
            desktop
            onClose={() => setSelected(null)}
          />
        ) : null}
      </div>

      {selected ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-ink/30 md:hidden"
            aria-label="Close day"
            onClick={() => setSelected(null)}
          />
          <DayPanel
            date={selected}
            plans={selectedPlans}
            events={selectedEvents}
            onClose={() => setSelected(null)}
          />
        </>
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  pressed,
  onToggle,
}: {
  label: string;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" aria-pressed={pressed} className={`chip ${pressed ? "chip-active" : ""}`} onClick={onToggle}>
      {label}
    </button>
  );
}

function PlanChip({ plan, compact }: { plan: CalendarPlan; compact?: boolean }) {
  return (
    <Link
      href={`/plans/${plan.id}`}
      title={plan.name}
      onClick={(event) => event.stopPropagation()}
      className="block truncate rounded-full bg-wine-mid px-2 py-0.5 text-[0.65rem] font-medium leading-tight text-on-deep hover:bg-wine"
    >
      {compact && plan.serviceTime ? `${plan.serviceTime} · ${plan.name}` : plan.name}
    </Link>
  );
}

function EventChip({ event }: { event: CalendarEvent }) {
  return (
    <span className="block truncate rounded-full border border-gold/70 bg-gold/15 px-2 py-0.5 text-[0.65rem] leading-tight text-wine-deep">
      {event.time ? `${event.time} · ${event.title}` : event.title}
    </span>
  );
}

function MonthGrid({
  days,
  cursor,
  today,
  selected,
  plans,
  events,
  onSelect,
}: {
  days: string[];
  cursor: string;
  today: string;
  selected: string | null;
  plans: CalendarPlan[];
  events: CalendarEvent[];
  onSelect: (iso: string) => void;
}) {
  return (
    <div className="paper-card overflow-hidden rounded-3xl">
      <div className="grid grid-cols-7 border-b border-line bg-paper-deep/60">
        {WEEKDAYS.map((label, index) => (
          <div key={label} className="px-1 py-2 text-center text-[0.68rem] uppercase tracking-[0.12em] text-muted">
            <span className="sm:hidden">{WEEKDAYS_NARROW[index]}</span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((iso, index) => {
          const dayPlans = plans.filter((plan) => plan.date === iso);
          const dayEvents = events.filter((event) => event.date === iso);
          const outside = !sameMonth(iso, cursor);
          const isToday = iso === today;
          const isSelected = iso === selected;
          return (
            <div
              key={iso}
              role="button"
              tabIndex={0}
              aria-label={formatPlanDate(iso)}
              aria-pressed={isSelected}
              onClick={() => onSelect(iso)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(iso);
                }
              }}
              className={`min-h-[5.5rem] border-b border-line p-1.5 sm:min-h-[7rem] sm:p-2 ${
                (index + 1) % 7 === 0 ? "" : "border-r"
              } ${outside ? "bg-paper-deep/35 text-muted" : "bg-card"} ${isSelected ? "bg-wine/[0.06]" : ""} ${
                isToday ? "ring-2 ring-inset ring-wine-deep" : ""
              }`}
            >
              <p className={`text-xs sm:text-sm ${isToday ? "font-semibold text-wine-deep" : ""}`}>
                {Number(iso.slice(-2))}
              </p>
              <div className="mt-1 flex flex-col gap-1">
                {dayPlans.map((plan) => (
                  <PlanChip key={plan.id} plan={plan} />
                ))}
                {dayEvents.map((event) => (
                  <EventChip key={event.id} event={event} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  days,
  today,
  selected,
  plans,
  events,
  onSelect,
}: {
  days: string[];
  today: string;
  selected: string | null;
  plans: CalendarPlan[];
  events: CalendarEvent[];
  onSelect: (iso: string) => void;
}) {
  const allDay = (iso: string) => ({
    plans: plans.filter((plan) => plan.date === iso && parseServiceHour(plan.serviceTime) == null),
    events: events.filter((event) => event.date === iso && !event.time),
  });

  function timedAt(iso: string, hour: number) {
    return {
      plans: plans.filter((plan) => plan.date === iso && parseServiceHour(plan.serviceTime) === hour),
      events: events.filter((event) => event.date === iso && parseServiceHour(event.time ?? "") === hour),
    };
  }

  return (
    <div className="paper-card overflow-hidden rounded-3xl">
      <div className="grid grid-cols-[2rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[2.75rem_repeat(7,minmax(0,1fr))]">
        <div className="border-b border-r border-line bg-paper-deep/60" />
        {days.map((iso, index) => {
          const isToday = iso === today;
          const isSelected = iso === selected;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              className={`border-b border-line px-0.5 py-2 text-center ${index < 6 ? "border-r" : ""} ${
                isSelected ? "bg-wine/[0.06]" : "bg-paper-deep/60"
              } ${isToday ? "ring-2 ring-inset ring-wine-deep" : ""}`}
            >
              <span className="block text-[0.62rem] uppercase tracking-[0.1em] text-muted sm:hidden">
                {WEEKDAYS_NARROW[index]}
              </span>
              <span className="hidden text-[0.68rem] uppercase tracking-[0.12em] text-muted sm:block">
                {WEEKDAYS[index]}
              </span>
              <span className={`mt-0.5 block text-sm ${isToday ? "font-semibold text-wine-deep" : ""}`}>
                {Number(iso.slice(-2))}
              </span>
            </button>
          );
        })}

        <div className="border-b border-r border-line bg-paper-deep/40 px-0.5 py-2 text-center text-[0.55rem] uppercase leading-tight tracking-[0.08em] text-muted sm:px-1 sm:text-[0.62rem]">
          All day
        </div>
        {days.map((iso, index) => {
          const items = allDay(iso);
          return (
            <div
              key={`all-${iso}`}
              role="button"
              tabIndex={0}
              aria-label={`${formatPlanDate(iso)} all day`}
              onClick={() => onSelect(iso)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(iso);
                }
              }}
              className={`min-h-[2.75rem] border-b border-line p-1 ${index < 6 ? "border-r" : ""} ${
                iso === selected ? "bg-wine/[0.06]" : "bg-card"
              } ${iso === today ? "ring-2 ring-inset ring-wine-deep" : ""}`}
            >
              <div className="flex flex-col gap-1">
                {items.plans.map((plan) => (
                  <PlanChip key={plan.id} plan={plan} />
                ))}
                {items.events.map((event) => (
                  <EventChip key={event.id} event={event} />
                ))}
              </div>
            </div>
          );
        })}

        {WEEK_HOURS.map((hour) => (
          <HourRow
            key={hour}
            hour={hour}
            days={days}
            today={today}
            selected={selected}
            timedAt={timedAt}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function HourRow({
  hour,
  days,
  today,
  selected,
  timedAt,
  onSelect,
}: {
  hour: number;
  days: string[];
  today: string;
  selected: string | null;
  timedAt: (iso: string, hour: number) => { plans: CalendarPlan[]; events: CalendarEvent[] };
  onSelect: (iso: string) => void;
}) {
  return (
    <>
      <div className="border-b border-r border-line bg-paper-deep/25 px-0.5 py-1 text-center text-[0.55rem] leading-tight text-muted sm:text-[0.62rem]">
        {formatHourLabel(hour)}
      </div>
      {days.map((iso, index) => {
        const items = timedAt(iso, hour);
        return (
          <div
            key={`${iso}-${hour}`}
            role="button"
            tabIndex={0}
            aria-label={`${formatPlanDate(iso)} ${formatHourLabel(hour)}`}
            onClick={() => onSelect(iso)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(iso);
              }
            }}
            className={`min-h-[2.5rem] border-b border-line p-1 sm:min-h-[3rem] ${index < 6 ? "border-r" : ""} ${
              iso === selected ? "bg-wine/[0.06]" : iso === today ? "bg-wine/[0.04]" : "bg-card"
            }`}
          >
            <div className="flex flex-col gap-1">
              {items.plans.map((plan) => (
                <PlanChip key={plan.id} plan={plan} compact />
              ))}
              {items.events.map((event) => (
                <EventChip key={event.id} event={event} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

function DayPanel({
  date,
  plans,
  events,
  onClose,
  desktop,
}: {
  date: string | null;
  plans: CalendarPlan[];
  events: CalendarEvent[];
  onClose: () => void;
  desktop?: boolean;
}) {
  const empty = plans.length === 0 && events.length === 0;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="field-label">This day</p>
          <h2 className="font-serif text-2xl tracking-tight">{date ? formatPlanDate(date) : "Choose a day"}</h2>
        </div>
        {date ? (
          <button type="button" className="btn btn-ghost shrink-0 px-3 py-1.5 text-sm" onClick={onClose}>
            Close
          </button>
        ) : null}
      </div>
      <ul className="mt-5 space-y-3">
        {plans.map((plan) => (
          <li key={plan.id} className="paper-card rounded-2xl px-4 py-3 md:border-0 md:bg-paper-deep/40 md:shadow-none">
            <p className="text-[0.68rem] uppercase tracking-[0.12em] text-wine-mid">Plan</p>
            <Link href={`/plans/${plan.id}`} className="font-serif text-xl text-wine underline-offset-4 hover:underline">
              {plan.name}
            </Link>
            <p className="mt-1 text-sm text-muted">
              {plan.serviceTime || "All day"}
              {plan.assigned ? " · You’re assigned" : ""}
            </p>
          </li>
        ))}
        {events.map((event) => (
          <li key={event.id} className="rounded-2xl bg-gold/15 px-4 py-3">
            <p className="text-[0.68rem] uppercase tracking-[0.12em] text-gold">Event</p>
            <p className="font-serif text-xl">{event.title}</p>
            <p className="mt-1 text-sm text-muted">{event.time || "All day"}</p>
          </li>
        ))}
        {date && empty ? <li className="text-sm text-muted">Nothing on this day.</li> : null}
        {!date ? <li className="text-sm text-muted">Select a day to see services and events.</li> : null}
      </ul>
    </>
  );

  if (desktop) {
    return (
      <aside className="paper-card hidden h-fit rounded-3xl p-5 md:sticky md:top-8 md:block" aria-live="polite">
        {body}
      </aside>
    );
  }

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label={date ? formatPlanDate(date) : "Day"}
      className="fixed inset-x-3 z-50 overflow-y-auto rounded-3xl p-5 paper-card md:hidden"
      style={{ bottom: "var(--dock-nav-clearance)", maxHeight: "min(70vh, 28rem)" }}
    >
      {body}
    </aside>
  );
}
