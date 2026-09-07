import { redirect } from "next/navigation";

export default async function TeamPersonRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/people/${id}`);
}
