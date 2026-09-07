export function HomeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 10.5 12 4.5l7.5 6V19a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-3v6H6A1.5 1.5 0 0 1 4.5 19v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="6" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function PeopleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 17.5c.8-2.2 2.6-3.3 5-3.3s4.2 1.1 5 3.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ScheduleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="6" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10.5h8M8 13.5h8M8 16.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MoreIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="6.5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="17.5" cy="12" r="1.4" />
    </svg>
  );
}

export function DockIcon({ href, className }: { href: string; className?: string }) {
  if (href === "/calendar") return <CalendarIcon className={className} />;
  if (href === "/people") return <PeopleIcon className={className} />;
  if (href === "/schedule" || href === "/events") return <ScheduleIcon className={className} />;
  return <HomeIcon className={className} />;
}
