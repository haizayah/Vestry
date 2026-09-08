"use client";

import { useState } from "react";
import { completeOnboardingAction } from "@/lib/actions";
import type { ModuleId, OrgType } from "@/lib/types";
import { VestryMark } from "./mark";
import { ModulePicker } from "./module-picker";

const STEPS = ["Account", "Org", "Modules"] as const;

export function OnboardingFlow({
  userName,
  userEmail,
  orgName,
  orgType,
  modules,
}: {
  userName: string;
  userEmail: string;
  orgName: string;
  orgType: OrgType;
  modules: ModuleId[];
}) {
  const [step, setStep] = useState<0 | 1 | 2>(2);
  const [name, setName] = useState(orgName);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-6 sm:px-8" data-brand="vestry">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <VestryMark />
        <p className="text-sm text-ink-soft">
          {STEPS.map((label, index) => (
            <span key={label}>
              {index > 0 ? <span className="text-muted"> · </span> : null}
              <span className={index === step ? "font-medium text-wine-deep" : "text-muted"}>
                {index + 1} {label}
              </span>
            </span>
          ))}
        </p>
      </header>

      {step === 0 ? (
        <div className="mx-auto mt-16 w-full max-w-xl flex-1">
          <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">Who’s signing in?</h1>
          <p className="mt-3 text-ink-soft">This demo account stays attached to the org. You can invite others later from People.</p>
          <div className="paper-card mt-8 rounded-3xl p-6">
            <p className="font-serif text-3xl text-wine-deep">{userName}</p>
            <p className="mt-1 text-ink-soft">{userEmail}</p>
          </div>
          <div className="mt-10 flex justify-end">
            <button type="button" className="btn btn-primary" onClick={() => setStep(1)}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mx-auto mt-16 w-full max-w-xl flex-1">
          <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">Name the org</h1>
          <p className="mt-3 text-ink-soft">Harbor can stay a church, or become a sports club. Modules come next.</p>
          <div className="mt-8">
            <label className="field-label" htmlFor="orgName">
              Org name
            </label>
            <input id="orgName" className="field" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="mt-10 flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
              Back
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <form action={completeOnboardingAction} className="mt-14 flex flex-1 flex-col">
          <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">What should Vestry help with?</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Pick the modules for {name || orgName}. You can change these later in Settings. Calendar and People stay on.
          </p>
          <div className="mt-8">
            <ModulePicker orgName={name || orgName} orgType={orgType} modules={modules} />
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 pb-8">
            <p className="text-sm text-muted">Chat and Resources are optional and off by default.</p>
            <div className="flex gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                Continue
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}
