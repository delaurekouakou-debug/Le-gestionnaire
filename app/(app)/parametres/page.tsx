"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import type { Entreprise, Role, Utilisateur } from "@/lib/types";

export default function ParametresPage() {
  const { profil } = useAuth();
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [copie, setCopie] = useState(false);
  const [rafraichissement, setRafraichissement] = useState(0);

  const declencherRafraichissement = () => setRafraichissement((n) => n + 1);

  useEffect(() => {
    let actif = true;
    (async () => {
      setChargement(true);
      const [{ data: entrepriseData }, { data: utilisateursData }] = await Promise.all([
        supabase.from("entreprises").select("*").maybeSingle(),
        supabase.from("utilisateurs").select("*").order("created_at", { ascending: true }),
      ]);
      if (!actif) return;
      setEntreprise(entrepriseData as Entreprise | null);
      setUtilisateurs((utilisateursData as Utilisateur[]) ?? []);
      setChargement(false);
    })();
    return () => {
      actif = false;
    };
  }, [rafraichissement]);

  const copierCode = async () => {
    if (!entreprise) return;
    await navigator.clipboard.writeText(entreprise.id);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  };

  const changerRole = async (utilisateurId: string, role: Role) => {
    await supabase.from("utilisateurs").update({ role }).eq("id", utilisateurId);
    declencherRafraichissement();
  };

  const estAdmin = profil?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-chart-ink">Paramètres</h1>
        <p className="text-sm text-chart-muted">Entreprise, invitations et droits d&apos;accès</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-chart-ink">Entreprise</h2>
        {chargement ? (
          <p className="mt-2 text-sm text-chart-muted">Chargement…</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <span className="text-chart-muted">Nom : </span>
              <span className="text-chart-ink">{entreprise?.nom}</span>
            </p>
            <p>
              <span className="text-chart-muted">Plan : </span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {entreprise?.plan_abonnement}
              </span>
            </p>
            {estAdmin && entreprise && (
              <div className="pt-2">
                <p className="text-chart-muted">
                  Code entreprise (à transmettre à vos employés pour qu&apos;ils rejoignent
                  votre espace depuis la page de connexion) :
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="rounded bg-zinc-100 px-2 py-1 text-xs text-chart-ink dark:bg-zinc-800">
                    {entreprise.id}
                  </code>
                  <button
                    onClick={copierCode}
                    className="flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs text-chart-ink-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {copie ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-good" strokeWidth={2.5} />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                        Copier
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-chart-ink">Utilisateurs</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-chart-muted dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2">Nom</th>
                <th className="px-3 py-2">Rôle</th>
                {estAdmin && <th className="px-3 py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-3 py-2 text-chart-ink">{u.nom}</td>
                  <td className="px-3 py-2 capitalize text-chart-ink-secondary">{u.role}</td>
                  {estAdmin && (
                    <td className="px-3 py-2">
                      {u.id !== profil?.id && (
                        <select
                          value={u.role}
                          onChange={(e) => changerRole(u.id, e.target.value as Role)}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-950"
                        >
                          <option value="admin">Administrateur</option>
                          <option value="employe">Employé</option>
                        </select>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
