// Séparateur de section décoratif : une ligne pleine suivie d'une rangée de
// petits traits verticaux, à la place d'un simple <hr>.
export default function TickDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`border-t border-chart-grid pt-1.5 ${className}`}>
      <div
        aria-hidden
        className="h-1.5 w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, var(--color-chart-baseline) 0, var(--color-chart-baseline) 1px, transparent 1px, transparent 12px)",
        }}
      />
    </div>
  );
}
