import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { formatPlanDate, isUpcoming } from "@/lib/format";
import { mediaReadyCount } from "@/lib/media";
import { requireModule } from "@/lib/guards";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Plans" };

export default async function PlansPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  requireModule(store, "worship");
  const plans = [...store.plans].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">Services</p>
          <h1 className="font-serif text-4xl tracking-tight md:text-5xl">Plans</h1>
        </div>
        {session.role === "director" ? (
          <Link href="/plans/new" className="btn btn-primary">
            New plan
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4">
        {plans.map((plan) => {
          const ready = mediaReadyCount(plan, store.songs);
          return (
            <Link key={plan.id} href={`/plans/${plan.id}`} className="paper-card block rounded-3xl p-6 transition hover:-translate-y-0.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-muted">{formatPlanDate(plan.date)}</p>
                  <h2 className="font-serif text-3xl">{plan.name}</h2>
                  <p className="mt-1 text-ink-soft">
                    {plan.serviceTime} · {plan.items.length} items · {plan.assignments.length} on the team
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="chip">{isUpcoming(plan.date) ? "Upcoming" : "Past"}</span>
                  <span className="chip">
                    Media {ready.ready}/{ready.total}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
