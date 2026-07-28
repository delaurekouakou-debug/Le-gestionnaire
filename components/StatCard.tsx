import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string;
  sousLibelle?: string;
  accent?: "brand" | "good" | "warning" | "critical";
}

const ACCENTS = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300",
  good: "bg-good/10 text-good",
  warning: "bg-warning/15 text-warning",
  critical: "bg-critical/10 text-critical",
};

export default function StatCard({ icon: Icon, label, value, sousLibelle, accent = "brand" }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-chart-surface p-4 shadow-sm dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ACCENTS[accent]}`}>
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <p className="text-sm font-medium text-chart-ink-secondary">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-chart-ink">{value}</p>
      {sousLibelle && <p className="mt-0.5 text-xs text-chart-muted">{sousLibelle}</p>}
    </div>
  );
}
