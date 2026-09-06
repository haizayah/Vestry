export function ConflictChip({
  tooltip,
}: {
  tooltip: string;
}) {
  return (
    <span className="chip border-gold/55 bg-gold/15 text-wine-deep" title={tooltip}>
      Conflict
    </span>
  );
}