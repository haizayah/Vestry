import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ModulePicker } from "@/components/module-picker";
import { updateOrgAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Modules" };

export default async function SettingsModulesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "director") redirect("/settings");
  const store = await readStore();

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm text-ink-soft">
        <span className="text-muted">1 Account · 2 Org · </span>
        <span className="font-medium text-wine-deep">3 Modules</span>
      </p>
      <h1 className="mt-4 font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">What should Vestry help with?</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Pick the modules for {store.churchName}. You can change these later in Settings. Calendar and People stay on.
      </p>
      <form action={updateOrgAction} className="mt-8">
        <ModulePicker orgName={store.churchName} orgType={store.orgType} modules={store.modules} />
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Chat and Resources are optional and off by default.</p>
          <div className="flex gap-3">
            <Link href="/settings" className="btn btn-ghost">
              Back
            </Link>
            <button className="btn btn-primary" type="submit">
              Continue
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
