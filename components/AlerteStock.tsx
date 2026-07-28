import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { statutStock } from "@/lib/stock";
import type { Produit } from "@/lib/types";

export { statutStock };

const STYLES = {
  rupture: "bg-critical/10 text-critical",
  alerte: "bg-warning/15 text-[#8a5a00] dark:text-warning",
  ok: "bg-good/10 text-good",
};

const ICONES = {
  rupture: XCircle,
  alerte: AlertTriangle,
  ok: CheckCircle2,
};

const LIBELLES = {
  rupture: "Rupture",
  alerte: "Stock bas",
  ok: "En stock",
};

export default function AlerteStock({
  produit,
}: {
  produit: Pick<Produit, "quantite" | "seuil_alerte">;
}) {
  const statut = statutStock(produit);
  const Icone = ICONES[statut];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[statut]}`}
    >
      <Icone className="h-3.5 w-3.5" strokeWidth={2.25} />
      {LIBELLES[statut]}
    </span>
  );
}
