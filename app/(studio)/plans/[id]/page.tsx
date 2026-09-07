import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { deletePlanAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { formatPlanDate } from "@/lib/format";
import { mediaReadyCount } from "@/lib/media";
import { requireModule } from "@/lib/guards";
import { readStore } from "@/lib/store";
import { PlanWorkspace } from "@/components/plan-workspace";
import { computeAssignmentConflicts } from "@/lib/lockout-api";

export const metadata: Metadata = { title: "Plan" };

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const store = await readStore();
  requireModule(store, "worship");
  const plan = store.plans.find((p) => p.id === id);
  if (!plan) notFound();
  const ready = mediaReadyCount(plan, store.songs);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="field-label">{formatPlanDate(plan.date)}</p>
          <h1 className="font-serif text-4xl tracking-tight md:text-5xl">{plan.name}</h1>
          <p className="mt-2 text-ink-soft">
            {plan.serviceTime} · {ready.ready} of {ready.total} songs have rehearsal media
          </p>
        </div>
        {session.role === "director" ? (
          <form action={deletePlanAction}>
            <input type="hidden" name="id" value={plan.id} />
            <button className="btn btn-danger" type="submit">
              Delete plan
            </button>
          </form>
        ) : null}
      </div>
      <PlanWorkspace
        plan={plan}
        songs={store.songs}
        people={store.people}
        user={session}
        assignmentConflicts={await computeAssignmentConflicts(plan.id)}
      />
    </div>
  );
}
