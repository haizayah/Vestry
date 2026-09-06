import { GothicArch } from "./gothic-arch";

export function VestryMark({
  className = "",
  layout = "inline",
  tone = "default",
}: {
  className?: string;
  layout?: "inline" | "stacked";
  tone?: "default" | "on-deep";
}) {
  const archColor = tone === "on-deep" ? "text-gold" : "text-wine-deep";
  const wordColor = tone === "on-deep" ? "text-on-deep" : "text-ink";
  const ruleColor = tone === "on-deep" ? "bg-gold/55" : "bg-wine-deep/70";

  if (layout === "stacked") {
    return (
      <span className={`inline-flex flex-col items-center ${className}`}>
        <GothicArch className={`h-11 w-12 ${archColor}`} />
        <span
          className={`mt-2.5 font-serif text-[1.7rem] font-medium leading-none tracking-[-0.03em] ${wordColor}`}
        >
          Vestry
        </span>
        <span className={`mt-2.5 h-px w-[5.1rem] ${ruleColor}`} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <GothicArch className={`h-8 w-[1.85rem] ${archColor}`} />
      <span className={`font-serif text-[1.4rem] font-medium leading-none tracking-[-0.03em] ${wordColor}`}>
        Vestry
      </span>
    </span>
  );
}
