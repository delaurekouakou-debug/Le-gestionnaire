import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from "lucide-react";
import type { TypeMouvement } from "@/lib/types";

export const CONFIG_MOUVEMENT: Record<
  TypeMouvement,
  { icone: typeof ArrowDownToLine; classe: string; dot: string; libelle: string }
> = {
  entree: {
    icone: ArrowDownToLine,
    classe: "bg-series-entree/10 text-series-entree",
    dot: "bg-series-entree",
    libelle: "Entrée",
  },
  sortie: {
    icone: ArrowUpFromLine,
    classe: "bg-series-sortie/10 text-series-sortie",
    dot: "bg-series-sortie",
    libelle: "Sortie",
  },
  ajustement: {
    icone: SlidersHorizontal,
    classe: "bg-series-ajustement/10 text-series-ajustement",
    dot: "bg-series-ajustement",
    libelle: "Ajustement",
  },
};

export default function MouvementBadge({ type }: { type: TypeMouvement }) {
  const config = CONFIG_MOUVEMENT[type];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-chart-ink-secondary">
      <span className={`h-2 w-2 shrink-0 ${config.dot}`} />
      {config.libelle}
    </span>
  );
}
