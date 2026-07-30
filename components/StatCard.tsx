import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string;
  sousLibelle?: string;
  accent?: "brand" | "good" | "warning" | "critical";
}

const ACCENTS = {
  brand: "text-brand-600 dark:text-brand-400",
  good: "text-good",
  warning: "text-warning",
  critical: "text-critical",
};

export default function StatCard({ icon: Icon, label, value, sousLibelle, accent = "brand" }: Props) {
  return (
    <div className="border border-zinc-200 bg-chart-surface p-4 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${ACCENTS[accent]}`} strokeWidth={2.25} />
        <p className="text-xs font-semibold uppercase tracking-widest text-chart-ink-secondary">
          {label}
        </p>
      </div>
      <p className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-chart-ink">{value}</p>
      {sousLibelle && <p className="mt-1 text-xs text-chart-muted">{sousLibelle}</p>}
    </div>
  );
}
