"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { VestryMark } from "./mark";
import type { PublicUser } from "@/lib/types";

const NAV = [
  { href: "/home", label: "Home" },
  { href: "/plans", label: "Plans" },
  { href: "/calendar", label: "Calendar" },
  { href: "/songs", label: "Songs" },
  { href: "/team", label: "Team" },
];

const SETTINGS_NAV = [
  { href: "/settings", label: "Settings" },
  { href: "/availability", label: "Availability" },
];

const MOBILE_NAV = [...NAV, { href: "/settings", label: "Settings" }];

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
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line/80 bg-wine-deep px-5 py-6 text-on-deep md:flex">
          <Link href="/home" className="mb-8">
            <VestryMark tone="on-deep" />
          </Link>
          <p className="mb-6 text-[0.68rem] uppercase tracking-[0.18em] text-on-deep/50">{churchName}</p>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2.5 text-sm transition ${
                    active ? "bg-on-deep/12 text-white" : "text-on-deep/70 hover:bg-on-deep/8 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <p className="mt-5 mb-1 px-3 text-[0.62rem] uppercase tracking-[0.16em] text-on-deep/40">Settings</p>
            {SETTINGS_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2.5 text-sm transition ${
                    active ? "bg-on-deep/12 text-white" : "text-on-deep/70 hover:bg-on-deep/8 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="font-serif text-lg leading-tight">{user.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-on-deep/50">
              {user.role === "director" ? "Music director" : "Team member"}
            </p>
            <form action={logoutAction} className="mt-4">
              <button type="submit" className="text-sm text-on-deep/70 underline-offset-4 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur md:hidden">
            <Link href="/home">
              <VestryMark />
            </Link>
            <span className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">{user.role}</span>
          </header>
          <main className="flex-1 px-4 pb-24 pt-6 sm:px-8 sm:py-10 md:pb-10">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-line bg-card/95 px-0.5 py-2 backdrop-blur md:hidden">
        {MOBILE_NAV.map((item) => {
          const active =
            item.href === "/settings"
              ? isActive(pathname, "/settings") || isActive(pathname, "/availability")
              : isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-0.5 py-2 text-center text-[0.62rem] tracking-wide ${
                active ? "bg-wine/10 text-wine" : "text-muted"
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
