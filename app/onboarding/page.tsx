import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "director") redirect("/home");
  const store = await readStore();

  return (
    <OnboardingFlow
      userName={session.name}
      userEmail={session.email}
      orgName={store.churchName}
      orgType={store.orgType}
      modules={store.modules}
    />
  );
}
