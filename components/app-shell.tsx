"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/lib/actions";
import { roleLabel } from "@/lib/modules";
import { desktopPrimaryNav, dockItems, moreItems } from "@/lib/nav";
import { orgAccent } from "@/lib/theme";
import type { ModuleId, OrgType, PublicUser } from "@/lib/types";
import { DockIcon, MoreIcon } from "./nav-icons";
import { audioSrc } from "@/lib/media";
import { VestryMark } from "./mark";

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  orgName,
  orgType,
  modules,
  logoFilename,
  logoDataUrl,
  children,
}: {
  user: PublicUser;
  orgName: string;
  orgType: OrgType;
  modules: ModuleId[];
  logoFilename?: string | null;
  logoDataUrl?: string | null;
  children: React.ReactNode;
}) {
  const logoSrc = logoDataUrl || audioSrc(logoFilename);
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = desktopPrimaryNav(modules);
  const dock = dockItems();
  const more = moreItems(modules);
  const moreActive = more.some((item) => isActive(pathname, item.href));

  return (
    <div className="min-h-full bg-paper" data-org-type={orgAccent(orgType)}>
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink px-5 py-6 text-on-deep md:flex">
          <Link href="/home" className="mb-10 flex items-center gap-3">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/20" />
            ) : null}
            <VestryMark tone="on-deep" />
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {primary.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link key={item.href} href={item.href} className={`nav-row ${active ? "nav-row-active" : ""}`}>
                  {item.label}
                </Link>
              );
            })}
            <p className="mt-6 mb-1 px-3 text-[0.62rem] uppercase tracking-[0.16em] text-on-deep/40">Account</p>
            <Link href="/settings" className={`nav-row ${isActive(pathname, "/settings") ? "nav-row-active" : ""}`}>
              Settings
            </Link>
            <Link
              href="/availability"
              className={`nav-row ${isActive(pathname, "/availability") ? "nav-row-active" : ""}`}
            >
              Availability
            </Link>
          </nav>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="font-serif text-lg leading-tight">{user.name}</p>
            <p className="mt-1 text-xs text-on-deep/55">
              {roleLabel(user.role)} · {orgName}
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
            <Link href="/home" className="flex items-center gap-2.5">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-line" />
              ) : null}
              <VestryMark />
            </Link>
            <span className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">{orgType}</span>
          </header>
          <main className="flex-1 px-4 pb-24 pt-6 sm:px-8 sm:py-10 md:pb-10">{children}</main>
        </div>
      </div>

      {moreOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-ink/25 md:hidden"
            aria-label="Close more"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[1.75rem] border-t border-line bg-paper px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-18px_40px_-28px_rgba(28,25,20,0.45)] md:hidden">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <h2 className="font-serif text-3xl text-ink">More</h2>
            <ul className="mt-4">
              {more.map((item) => (
                <li key={item.href} className="border-b border-line/80 last:border-0">
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center justify-between py-4 text-[1.05rem] text-ink"
                  >
                    <span>{item.label}</span>
                    {item.moreMeta ? <span className="text-sm text-muted">{item.moreMeta}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-card/95 px-1 py-2 backdrop-blur md:hidden"
        style={{ gridTemplateColumns: `repeat(${dock.length + 1}, minmax(0, 1fr))` }}
      >
        {dock.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={`flex flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 text-[0.62rem] tracking-wide ${
                active && !moreOpen ? "text-accent-deep" : "text-slate"
              }`}
            >
              <DockIcon href={item.href} className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className={`flex flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 text-[0.62rem] tracking-wide ${
            moreOpen || moreActive ? "text-accent-deep" : "text-slate"
          }`}
        >
          <MoreIcon className="h-5 w-5" />
          More
        </button>
      </nav>
    </div>
  );
}
