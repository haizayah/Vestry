"use client";

import { useMemo, useState } from "react";
import {
  ALWAYS_ON_MODULES,
  MODULE_CARDS,
  ORG_TYPE_LABELS,
  suggestedModules,
} from "@/lib/modules";
import { ORG_TYPES, type ModuleId, type OrgType } from "@/lib/types";

export function ModulePicker({
  orgName,
  orgType,
  modules,
  nameField = "orgName",
}: {
  orgName: string;
  orgType: OrgType;
  modules: ModuleId[];
  nameField?: string;
}) {
  const [type, setType] = useState<OrgType>(orgType);
  const [selected, setSelected] = useState<ModuleId[]>(modules);

  const cards = useMemo(() => MODULE_CARDS, []);

  function toggle(id: ModuleId) {
    if (ALWAYS_ON_MODULES.includes(id)) return;
    const meta = MODULE_CARDS.find((card) => card.id === id);
    if (meta?.later) return;
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function chooseType(next: OrgType) {
    setType(next);
    setSelected(suggestedModules(next));
  }

  return (
    <div className="space-y-8">
      <input type="hidden" name={nameField} value={orgName} />
      <input type="hidden" name="orgType" value={type} />
      {ALWAYS_ON_MODULES.map((id) => (
        <input key={`always-${id}`} type="hidden" name="modules" value={id} />
      ))}
      {selected
        .filter((id) => !ALWAYS_ON_MODULES.includes(id))
        .map((id) => (
          <input key={id} type="hidden" name="modules" value={id} />
        ))}

      <div className="flex flex-wrap gap-2">
        {ORG_TYPES.map((option) => {
          const active = type === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => chooseType(option)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                active ? "border-wine-deep bg-wine/[0.04] text-wine-deep" : "border-line bg-card text-ink-soft"
              }`}
            >
              {ORG_TYPE_LABELS[option]}
              {active ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const on = card.alwaysOn || selected.includes(card.id);
          const locked = Boolean(card.alwaysOn || card.later);
          return (
            <button
              key={card.id}
              type="button"
              disabled={locked && !card.alwaysOn}
              onClick={() => toggle(card.id)}
              className={`relative rounded-3xl p-5 text-left transition ${
                card.later ? "opacity-55" : ""
              } ${
                on && !card.later
                  ? "border-2 border-wine-deep bg-card"
                  : "border border-transparent bg-paper-deep/40"
              }`}
            >
              {on && !card.later ? (
                <span className="absolute top-4 right-4 grid h-6 w-6 place-items-center rounded-full bg-gold text-[0.7rem] text-wine-deep">
                  ✓
                </span>
              ) : null}
              <p className="pr-8 font-serif text-2xl text-wine-deep">{card.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{card.description}</p>
              {card.alwaysOn ? (
                <p className="mt-4 text-[0.62rem] uppercase tracking-[0.16em] text-gold">Always on</p>
              ) : null}
              {card.optional ? (
                <p className="mt-4 text-[0.62rem] uppercase tracking-[0.16em] text-gold">Optional</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
