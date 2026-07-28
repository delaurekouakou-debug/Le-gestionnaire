"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { MouvementAvecProduit, Produit } from "@/lib/types";
import MouvementForm from "@/components/MouvementForm";
import MouvementBadge from "@/components/MouvementBadge";

export default function MouvementsPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [mouvements, setMouvements] = useState<MouvementAvecProduit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(0);

  const declencherRafraichissement = () => setRafraichissement((n) => n + 1);

  useEffect(() => {
    let actif = true;
    (async () => {
      setChargement(true);
      const [{ data: produitsData }, { data: mouvementsData }] = await Promise.all([
        supabase.from("produits").select("*").order("nom", { ascending: true }),
        supabase
          .from("mouvements")
          .select("*, produit:produits(id, nom, reference)")
          .order("date", { ascending: false })
          .limit(100),
      ]);
      if (!actif) return;
      setProduits((produitsData as Produit[]) ?? []);
      setMouvements((mouvementsData as MouvementAvecProduit[]) ?? []);
      setChargement(false);
    })();
    return () => {
      actif = false;
    };
  }, [rafraichissement]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-chart-ink">Mouvements de stock</h1>
        <p className="text-sm text-chart-muted">Entrées, sorties et ajustements — journal d&apos;audit</p>
      </div>

      <MouvementForm produits={produits} onEnregistre={declencherRafraichissement} />

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-chart-surface shadow-sm dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-chart-muted dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Quantité</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-chart-muted">
                  Chargement…
                </td>
              </tr>
            )}
            {!chargement && mouvements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-chart-muted">
                  Aucun mouvement enregistré.
                </td>
              </tr>
            )}
            {mouvements.map((m) => (
              <tr key={m.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-2.5 tabular-nums text-chart-muted">
                  {new Date(m.date).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-2.5 font-medium text-chart-ink">
                  {m.produit?.nom ?? "Produit supprimé"}
                </td>
                <td className="px-4 py-2.5">
                  <MouvementBadge type={m.type} />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-chart-ink">{m.quantite}</td>
                <td className="px-4 py-2.5 text-chart-muted">{m.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
