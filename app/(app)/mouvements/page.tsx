"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { MouvementAvecProduit, Produit } from "@/lib/types";
import MouvementForm from "@/components/MouvementForm";

const LIBELLES_TYPE: Record<string, string> = {
  entree: "Entrée",
  sortie: "Sortie",
  ajustement: "Ajustement",
};

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
      <h1 className="text-xl font-bold">Mouvements de stock</h1>

      <MouvementForm produits={produits} onEnregistre={declencherRafraichissement} />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Produit</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2 text-right">Quantité</th>
              <th className="px-4 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  Chargement…
                </td>
              </tr>
            )}
            {!chargement && mouvements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  Aucun mouvement enregistré.
                </td>
              </tr>
            )}
            {mouvements.map((m) => (
              <tr key={m.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-2 text-zinc-500">
                  {new Date(m.date).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-2 font-medium">
                  {m.produit?.nom ?? "Produit supprimé"}
                </td>
                <td className="px-4 py-2">{LIBELLES_TYPE[m.type] ?? m.type}</td>
                <td className="px-4 py-2 text-right">{m.quantite}</td>
                <td className="px-4 py-2 text-zinc-500">{m.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
