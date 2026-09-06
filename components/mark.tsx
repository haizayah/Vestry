export function VestryMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-full bg-sage-deep text-brass-soft">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M6 18V8.2c0-1.8 2.4-2.8 4.1-1.7L12 7.6l1.9-1.1C15.6 5.4 18 6.4 18 8.2V18"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4.5 18.5h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-serif text-[1.35rem] leading-none tracking-tight text-ink">
        Vestry
      </span>
    </span>
  );
}
