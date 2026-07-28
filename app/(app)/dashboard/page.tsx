"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, PackageX, ArrowLeftRight, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { MouvementAvecProduit, Produit } from "@/lib/types";
import { statutStock } from "@/lib/stock";
import StatCard from "@/components/StatCard";
import MouvementsBarChart, { type JourMouvements } from "@/components/charts/MouvementsBarChart";
import RepartitionStockBar from "@/components/charts/RepartitionStockBar";
import ActiviteRecente from "@/components/ActiviteRecente";
import AReapprovisionner from "@/components/AReapprovisionner";

function debutJour(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function DashboardPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [mouvements7Jours, setMouvements7Jours] = useState<MouvementAvecProduit[]>([]);
  const [derniersMouvements, setDerniersMouvements] = useState<MouvementAvecProduit[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let actif = true;
    (async () => {
      const ilYA7Jours = debutJour(new Date());
      ilYA7Jours.setDate(ilYA7Jours.getDate() - 6);

      const [{ data: produitsData }, { data: mouvements7JData }, { data: derniersData }] =
        await Promise.all([
          supabase.from("produits").select("*"),
          supabase
            .from("mouvements")
            .select("*, produit:produits(id, nom, reference)")
            .gte("date", ilYA7Jours.toISOString())
            .order("date", { ascending: true }),
          supabase
            .from("mouvements")
            .select("*, produit:produits(id, nom, reference)")
            .order("date", { ascending: false })
            .limit(8),
        ]);

      if (!actif) return;
      setProduits((produitsData as Produit[]) ?? []);
      setMouvements7Jours((mouvements7JData as MouvementAvecProduit[]) ?? []);
      setDerniersMouvements((derniersData as MouvementAvecProduit[]) ?? []);
      setChargement(false);
    })();
    return () => {
      actif = false;
    };
  }, []);

  const stats = useMemo(() => {
    const valeurStock = produits.reduce((total, p) => total + p.prix * p.quantite, 0);
    const enAlerte = produits.filter((p) => statutStock(p) === "alerte").length;
    const enRupture = produits.filter((p) => statutStock(p) === "rupture").length;
    const ok = produits.length - enAlerte - enRupture;
    return { valeurStock, enAlerte, enRupture, ok, nbProduits: produits.length };
  }, [produits]);

  const jours = useMemo<JourMouvements[]>(() => {
    const base: JourMouvements[] = [];
    for (let i = 6; i >= 0; i--) {
      const jour = debutJour(new Date());
      jour.setDate(jour.getDate() - i);
      base.push({
        libelle: jour.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" }),
        entree: 0,
        sortie: 0,
      });
    }

    mouvements7Jours.forEach((m) => {
      const jourMouvement = debutJour(new Date(m.date));
      const indexJour = base.findIndex((_, i) => {
        const ref = debutJour(new Date());
        ref.setDate(ref.getDate() - (6 - i));
        return ref.getTime() === jourMouvement.getTime();
      });
      if (indexJour === -1) return;
      if (m.type === "entree") base[indexJour].entree += m.quantite;
      if (m.type === "sortie") base[indexJour].sortie += m.quantite;
    });

    return base;
  }, [mouvements7Jours]);

  const mouvementsSemaine = jours.reduce((t, j) => t + j.entree + j.sortie, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-chart-ink">Tableau de bord</h1>
        <p className="text-sm text-chart-muted">Vue d&apos;ensemble de l&apos;activité du stock</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Boxes}
          label="Valeur totale du stock"
          value={chargement ? "…" : `${stats.valeurStock.toLocaleString("fr-FR")} F`}
          accent="brand"
        />
        <StatCard
          icon={TriangleAlert}
          label="Produits en alerte"
          value={chargement ? "…" : String(stats.enAlerte)}
          sousLibelle="Sous le seuil de réapprovisionnement"
          accent="warning"
        />
        <StatCard
          icon={PackageX}
          label="Produits en rupture"
          value={chargement ? "…" : String(stats.enRupture)}
          sousLibelle="Quantité à zéro"
          accent="critical"
        />
        <StatCard
          icon={ArrowLeftRight}
          label="Mouvements (7 jours)"
          value={chargement ? "…" : String(mouvementsSemaine)}
          sousLibelle="Entrées + sorties cumulées"
          accent="brand"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-chart-ink">Mouvements — 7 derniers jours</h2>
          {chargement ? (
            <p className="text-sm text-chart-muted">Chargement…</p>
          ) : (
            <MouvementsBarChart jours={jours} />
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-chart-ink">Répartition du stock</h2>
          {chargement ? (
            <p className="text-sm text-chart-muted">Chargement…</p>
          ) : (
            <RepartitionStockBar ok={stats.ok} alerte={stats.enAlerte} rupture={stats.enRupture} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-chart-ink">À réapprovisionner</h2>
          {chargement ? (
            <p className="text-sm text-chart-muted">Chargement…</p>
          ) : (
            <AReapprovisionner produits={produits} />
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-chart-ink">Activité récente</h2>
          {chargement ? (
            <p className="text-sm text-chart-muted">Chargement…</p>
          ) : (
            <ActiviteRecente mouvements={derniersMouvements} />
          )}
        </div>
      </div>
    </div>
  );
}
