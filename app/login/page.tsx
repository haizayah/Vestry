import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { VestryMark } from "@/components/mark";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 md:px-10">
        <Link href="/">
          <VestryMark />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <p className="field-label">Harbor Church</p>
          <h1 className="mt-2 font-serif text-4xl">Come in quietly.</h1>
          <p className="mt-3 mb-8 text-ink-soft">
            Director sees the whole room. Members see the plans they’re on — and can rehearse in place.
          </p>
          <LoginForm />
        </div>
      </div>
      <div className="hidden bg-sage-deep p-12 text-[#f6f1e8] lg:flex lg:flex-col lg:justify-end">
        <p className="text-[0.72rem] uppercase tracking-[0.2em] text-brass-soft">This week</p>
        <p className="mt-4 font-serif text-5xl leading-tight">
          Goodness of God in G.
          <br />
          Holy Forever to close.
        </p>
        <p className="mt-6 max-w-md text-[#f6f1e8]/70">
          The demo is seeded with Harbor Church’s library and two upcoming Sundays. Upload a rehearsal track and it
          plays beside the setlist.
        </p>
      </div>
    </div>
  );
}
