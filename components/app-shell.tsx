"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { VestryMark } from "./mark";
import type { PublicUser } from "@/lib/types";

const NAV = [
  { href: "/home", label: "Home" },
  { href: "/plans", label: "Plans" },
  { href: "/songs", label: "Songs" },
  { href: "/team", label: "Team" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  churchName,
  children,
}: {
  user: PublicUser;
  churchName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-full bg-paper">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line/80 bg-sage-deep px-5 py-6 text-[#f6f1e8] md:flex">
          <Link href="/home" className="mb-8">
            <span className="inline-flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f6f1e8]/10 text-brass-soft">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                  <path
                    d="M6 18V8.2c0-1.8 2.4-2.8 4.1-1.7L12 7.6l1.9-1.1C15.6 5.4 18 6.4 18 8.2V18"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path d="M4.5 18.5h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <span className="font-serif text-[1.4rem] leading-none">Vestry</span>
            </span>
          </Link>
          <p className="mb-6 text-[0.68rem] uppercase tracking-[0.18em] text-[#f6f1e8]/50">{churchName}</p>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2.5 text-sm transition ${
                    active ? "bg-[#f6f1e8]/12 text-white" : "text-[#f6f1e8]/70 hover:bg-[#f6f1e8]/8 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="font-serif text-lg leading-tight">{user.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#f6f1e8]/50">
              {user.role === "director" ? "Music director" : "Team member"}
            </p>
            <form action={logoutAction} className="mt-4">
              <button type="submit" className="text-sm text-[#f6f1e8]/70 underline-offset-4 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur md:hidden">
            <Link href="/home">
              <VestryMark />
            </Link>
            <span className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">{user.role}</span>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card/95 px-1 py-2 backdrop-blur md:hidden">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-1 py-2 text-center text-[0.7rem] tracking-wide ${
                active ? "text-sage" : "text-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
