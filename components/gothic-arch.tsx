import { useId } from "react";

const ARCH =
  "M8 54A48 48 0 0 1 32 12.43A48 48 0 0 1 56 54";

export function GothicArch({
  className = "",
  variant = "inlay",
}: {
  className?: string;
  variant?: "inlay" | "line";
}) {
  const uid = useId().replace(/:/g, "");
  const maskId = `vestry-arch-inlay-${uid}`;

  return (
    <svg viewBox="0 0 64 58" className={className} fill="none" aria-hidden>
      {variant === "line" ? (
        <path
          d={ARCH}
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="butt"
        />
      ) : (
        <>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <rect width="64" height="58" fill="white" />
              <path d={ARCH} stroke="black" strokeWidth="1.85" fill="none" />
            </mask>
          </defs>
          <path
            d={ARCH}
            stroke="currentColor"
            strokeWidth="6.6"
            strokeLinecap="butt"
            mask={`url(#${maskId})`}
          />
        </>
      )}
    </svg>
  );
}
