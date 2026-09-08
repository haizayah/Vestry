import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookResourceForm, ResourceBookingList } from "@/components/resource-bookings";
import { createResourceAction, deleteResourceAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { requireModule } from "@/lib/guards";
import { hasModule } from "@/lib/modules";
import { bookableSlots, RESOURCE_KIND_LABELS } from "@/lib/resources";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  requireModule(store, "resources");
  const director = session.role === "director";
  const slots = bookableSlots(store, hasModule(store.modules, "worship"));
  const rooms = store.resources.filter((resource) => resource.kind === "room");
  const gear = store.resources.filter((resource) => resource.kind === "gear");

  return (
    <div className="mx-auto max-w-5xl">
      <p className="field-label">{store.churchName}</p>
      <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">Resources</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Rooms and gear, booked against an event or occurrence. Double-books stay warn-only — gold chip, never a blocked
        save.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section>
            <p className="field-label">Catalog</p>
            <h2 className="font-serif text-2xl text-wine-deep">Rooms & gear</h2>
            <div className="mt-4 grid gap-3">
              {[...rooms, ...gear].map((resource) => {
                const count = store.bookings.filter((booking) => booking.resourceId === resource.id).length;
                return (
                  <article key={resource.id} className="paper-card rounded-3xl p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-2xl text-wine-deep">{resource.name}</h3>
                        <p className="text-sm text-muted">
                          {RESOURCE_KIND_LABELS[resource.kind]}
                          {count ? ` · ${count} booked` : ""}
                        </p>
                        {resource.notes ? <p className="mt-2 text-sm text-ink-soft">{resource.notes}</p> : null}
                      </div>
                      {director ? (
                        <form action={deleteResourceAction}>
                          <input type="hidden" name="id" value={resource.id} />
                          <button className="btn btn-danger px-3 py-1.5 text-sm" type="submit">
                            Remove
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </article>
                );
              })}
              {store.resources.length === 0 ? (
                <div className="paper-card rounded-3xl p-8 text-ink-soft">No rooms or gear yet.</div>
              ) : null}
            </div>
          </section>

          <section>
            <p className="field-label">Bookings</p>
            <h2 className="mb-4 font-serif text-2xl text-wine-deep">Against events</h2>
            <ResourceBookingList
              resources={store.resources}
              bookings={[...store.bookings].sort((a, b) => a.date.localeCompare(b.date))}
              allBookings={store.bookings}
              events={store.events}
              plans={store.plans}
              director={director}
            />
          </section>
        </div>

        {director ? (
          <div className="space-y-6">
            <form action={createResourceAction} className="paper-card h-fit space-y-4 rounded-3xl p-5">
              <p className="field-label">Add a resource</p>
              <div>
                <label className="field-label" htmlFor="name">
                  Name
                </label>
                <input id="name" name="name" required className="field" />
              </div>
              <div>
                <label className="field-label" htmlFor="kind">
                  Type
                </label>
                <select id="kind" name="kind" className="field" defaultValue="room">
                  <option value="room">Room</option>
                  <option value="gear">Gear</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="notes">
                  Notes
                </label>
                <input id="notes" name="notes" className="field" />
              </div>
              <button className="btn btn-primary w-full" type="submit">
                Add to catalog
              </button>
            </form>

            <section className="paper-card space-y-4 rounded-3xl p-5">
              <p className="field-label">Book a slot</p>
              <BookResourceForm resources={store.resources} slots={slots} />
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
