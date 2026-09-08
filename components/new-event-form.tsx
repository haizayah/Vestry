"use client";

import { useState } from "react";
import { createEventAction } from "@/lib/actions";
const WEEKDAY_CHIPS = ["S", "M", "T", "W", "T", "F", "Sa"] as const;
import type { RepeatFreq } from "@/lib/types";

const REPEATS: { id: RepeatFreq; label: string }[] = [
  { id: "none", label: "Does not repeat" },
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "Biweekly" },
  { id: "monthly", label: "Monthly" },
];

export function NewEventForm({
  defaultTitle = "Saturday League Match",
  defaultDate,
  defaultTime = "10:00 AM",
  onCancel,
}: {
  defaultTitle?: string;
  defaultDate: string;
  defaultTime?: string;
  onCancel?: () => void;
}) {
  const [repeat, setRepeat] = useState<RepeatFreq>("weekly");
  const [weekdays, setWeekdays] = useState<number[]>([6]);
  const [endsMode, setEndsMode] = useState<"count" | "until">("count");
  const repeating = repeat !== "none";
  const unit = repeat === "monthly" ? "month" : "week";

  function toggleDay(day: number) {
    setWeekdays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort()));
  }

  return (
    <form action={createEventAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="title">
          Title
        </label>
        <input id="title" name="title" required defaultValue={defaultTitle} className="field" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="date">
            Starts
          </label>
          <input id="date" name="date" type="date" required defaultValue={defaultDate} className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="time">
            Time
          </label>
          <input id="time" name="time" defaultValue={defaultTime} className="field" />
        </div>
      </div>
      <input type="hidden" name="location" value="Away vs Northside" />

      <div>
        <p className="field-label">Repeat</p>
        <div className="flex flex-wrap gap-2">
          {REPEATS.map((option) => {
            const active = repeat === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setRepeat(option.id)}
                className={`rounded-full border px-3.5 py-1.5 text-sm ${
                  active ? "border-wine-deep bg-wine/[0.04] text-wine-deep" : "border-line bg-card text-ink-soft"
                }`}
              >
                {option.label}
                {active ? " ✓" : ""}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="repeat" value={repeat} />
      </div>

      {repeating ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="interval">
                Every
              </label>
              <div className="flex items-center gap-2">
                <input id="interval" name="interval" type="number" min={1} max={12} defaultValue={1} className="field" />
                <span className="shrink-0 text-sm text-ink-soft">{unit}</span>
              </div>
            </div>
            <div>
              <p className="field-label">Ends</p>
              <div className="flex gap-2">
                <select
                  name="endsMode"
                  className="field"
                  value={endsMode}
                  onChange={(event) => setEndsMode(event.target.value === "until" ? "until" : "count")}
                >
                  <option value="count">After N occurrences</option>
                  <option value="until">On a date</option>
                </select>
              </div>
              {endsMode === "count" ? (
                <input name="endsCount" type="number" min={1} max={104} defaultValue={12} className="field mt-2" />
              ) : (
                <input name="endsOn" type="date" defaultValue={defaultDate} className="field mt-2" />
              )}
            </div>
          </div>

          {repeat !== "monthly" ? (
            <div>
              <p className="field-label">On</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_CHIPS.map((label, index) => {
                  const active = weekdays.includes(index);
                  return (
                    <button
                      key={`${label}-${index}`}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`min-w-10 rounded-full border px-2.5 py-2 text-sm ${
                        active ? "border-wine-deep bg-wine/[0.06] text-wine-deep" : "border-line text-ink-soft"
                      }`}
                    >
                      {active ? `${label} ✓` : label}
                    </button>
                  );
                })}
              </div>
              {weekdays.map((day) => (
                <input key={day} type="hidden" name="weekday" value={day} />
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      <div className="rounded-2xl border border-gold/45 bg-gold/15 px-4 py-3 text-sm text-ink">
        <p className="font-medium">Conflicts stay warn-only.</p>
        <p className="mt-1 text-ink/80">
          If an assignee has a lockout on an occurrence, show a gold Conflict chip — never block save.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel ? (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn-primary">
          {repeating ? "Create series" : "Create event"}
        </button>
      </div>
    </form>
  );
}

export function NewEventModal({
  open,
  defaultDate,
  onClose,
}: {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <button type="button" className="absolute inset-0 bg-ink/35" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[1.75rem] bg-card p-5 shadow-[0_24px_60px_-28px_rgba(28,25,20,0.55)] sm:p-7">
        <h2 className="font-serif text-4xl tracking-tight text-wine-deep">New event</h2>
        <p className="mt-2 mb-5 text-ink-soft">Recurring create — Phase A. Assignments keep warn-only conflict badges.</p>
        <NewEventForm defaultDate={defaultDate} onCancel={onClose} />
      </div>
    </div>
  );
}
