import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActivityList } from "@/components/activity-list";
import { visibleActivity } from "@/lib/activity";
import { getSession } from "@/lib/auth";
import { hasModule } from "@/lib/modules";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  const items = visibleActivity(store.activity, store.modules);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="field-label">Org</p>
      <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">Activity</h1>
      <p className="mt-3 text-ink-soft">
        Lightweight feed — assignments, replies, new events or series
        {hasModule(store.modules, "chat") ? ", chat posts" : ""}
        {hasModule(store.modules, "resources") ? ", and resource bookings" : ""}.
      </p>
      <div className="mt-8">
        <ActivityList items={items} empty="Nothing has happened in this room yet." />
      </div>
    </div>
  );
}
