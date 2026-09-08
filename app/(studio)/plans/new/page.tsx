import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createPlanAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { todayISO } from "@/lib/format";
import { hasModule } from "@/lib/modules";
import { readStore } from "@/lib/store";
import { ModuleOffState } from "@/components/module-off-state";

export const metadata: Metadata = { title: "New plan" };

export default async function NewPlanPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "director") redirect("/plans");
  const store = await readStore();
  if (!hasModule(store.modules, "worship")) return <ModuleOffState moduleId="worship" />;

  return (
    <div className="mx-auto max-w-xl">
      <p className="field-label">Create</p>
      <h1 className="font-serif text-4xl">A new Sunday</h1>
      <p className="mt-2 mb-8 text-ink-soft">Name the gathering, set the date, then build the order of service.</p>
      <form action={createPlanAction} className="paper-card space-y-4 rounded-3xl p-6">
        <div>
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input id="name" name="name" defaultValue="Sunday Gathering" className="field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="date">
              Date
            </label>
            <input id="date" name="date" type="date" required defaultValue={todayISO()} className="field" />
          </div>
          <div>
            <label className="field-label" htmlFor="serviceTime">
              Time
            </label>
            <input id="serviceTime" name="serviceTime" defaultValue="10:00 AM" className="field" />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="notes">
            Notes
          </label>
          <textarea id="notes" name="notes" rows={3} className="field" placeholder="Series, guest preacher, production notes…" />
        </div>
        <button className="btn btn-primary" type="submit">
          Create plan
        </button>
      </form>
    </div>
  );
}
