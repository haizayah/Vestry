"use client";

import { useActionState } from "react";
import { demoDirectorLoginAction, demoMemberLoginAction, loginAction } from "@/lib/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => loginAction(formData),
    null,
  );

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="field" placeholder="you@harbor.church" />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input id="password" name="password" type="password" required className="field" />
        </div>
        {state?.error ? <p className="text-sm text-rose">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Opening the room…" : "Enter Vestry"}
        </button>
      </form>

      <div className="hairline" />

      <div className="grid gap-3 sm:grid-cols-2">
        <form action={demoDirectorLoginAction}>
          <button type="submit" className="btn btn-ghost w-full">
            Director demo
          </button>
        </form>
        <form action={demoMemberLoginAction}>
          <button type="submit" className="btn btn-ghost w-full">
            Member demo
          </button>
        </form>
      </div>
      <p className="text-center text-sm text-muted">
        Both accounts use password <span className="text-ink">vestry</span>
      </p>
    </div>
  );
}
