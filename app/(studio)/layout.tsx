import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();

  return (
    <AppShell
      user={session}
      orgName={store.churchName}
      orgType={store.orgType}
      modules={store.modules}
      logoFilename={store.logoFilename}
      logoDataUrl={store.logoDataUrl}
    >
      {children}
    </AppShell>
  );
}
