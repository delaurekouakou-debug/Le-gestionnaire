import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from "lucide-react";
import type { TypeMouvement } from "@/lib/types";

export const CONFIG_MOUVEMENT: Record<
  TypeMouvement,
  { icone: typeof ArrowDownToLine; classe: string; libelle: string }
> = {
  entree: { icone: ArrowDownToLine, classe: "bg-series-entree/10 text-series-entree", libelle: "Entrée" },
  sortie: { icone: ArrowUpFromLine, classe: "bg-series-sortie/10 text-series-sortie", libelle: "Sortie" },
  ajustement: {
    icone: SlidersHorizontal,
    classe: "bg-series-ajustement/10 text-series-ajustement",
    libelle: "Ajustement",
  },
};

export default function MouvementBadge({ type }: { type: TypeMouvement }) {
  const config = CONFIG_MOUVEMENT[type];
  const Icone = config.icone;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.classe}`}
    >
      <Icone className="h-3.5 w-3.5" strokeWidth={2.25} />
      {config.libelle}
    </span>
  );
}
