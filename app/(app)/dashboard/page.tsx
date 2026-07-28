"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { MouvementAvecProduit, Produit } from "@/lib/types";
import { statutStock } from "@/components/AlerteStock";

const LIBELLES_TYPE: Record<string, string> = {
  entree: "Entrée",
  sortie: "Sortie",
  ajustement: "Ajustement",
};

export default function DashboardPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [derniersMouvements, setDerniersMouvements] = useState<MouvementAvecProduit[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const [{ data: produitsData }, { data: mouvementsData }] = await Promise.all([
        supabase.from("produits").select("*"),
        supabase
          .from("mouvements")
          .select("*, produit:produits(id, nom, reference)")
          .order("date", { ascending: false })
          .limit(10),
      ]);
      setProduits((produitsData as Produit[]) ?? []);
      setDerniersMouvements((mouvementsData as MouvementAvecProduit[]) ?? []);
      setChargement(false);
    };
    charger();
  }, []);

  const stats = useMemo(() => {
    const valeurStock = produits.reduce((total, p) => total + p.prix * p.quantite, 0);
    const enAlerte = produits.filter((p) => statutStock(p) !== "ok").length;
    return { valeurStock, enAlerte, nbProduits: produits.length };
  }, [produits]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Tableau de bord</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Valeur totale du stock</p>
          <p className="mt-1 text-2xl font-bold">
            {chargement ? "…" : stats.valeurStock.toLocaleString("fr-FR")}
          </p>
        </div>
        <Link
          href="/produits"
          className="rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500">Produits en alerte / rupture</p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {chargement ? "…" : stats.enAlerte}
          </p>
        </Link>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Nombre de produits</p>
          <p className="mt-1 text-2xl font-bold">{chargement ? "…" : stats.nbProduits}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Derniers mouvements</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Produit</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">Quantité</th>
              </tr>
            </thead>
            <tbody>
              {chargement && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                    Chargement…
                  </td>
                </tr>
              )}
              {!chargement && derniersMouvements.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                    Aucun mouvement enregistré.
                  </td>
                </tr>
              )}
              {derniersMouvements.map((m) => (
                <tr key={m.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-2 text-zinc-500">
                    {new Date(m.date).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {m.produit?.nom ?? "Produit supprimé"}
                  </td>
                  <td className="px-4 py-2">{LIBELLES_TYPE[m.type] ?? m.type}</td>
                  <td className="px-4 py-2 text-right">{m.quantite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
