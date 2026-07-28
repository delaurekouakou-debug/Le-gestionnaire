"use client";

import { useEffect, useState } from "react";
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
      <h1 className="text-xl font-bold">Paramètres</h1>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Entreprise</h2>
        {chargement ? (
          <p className="mt-2 text-sm text-zinc-500">Chargement…</p>
        ) : (
          <div className="mt-2 space-y-2 text-sm">
            <p>
              <span className="text-zinc-500">Nom : </span>
              {entreprise?.nom}
            </p>
            <p>
              <span className="text-zinc-500">Plan : </span>
              {entreprise?.plan_abonnement}
            </p>
            {estAdmin && entreprise && (
              <div>
                <p className="text-zinc-500">
                  Code entreprise (à transmettre à vos employés pour qu&apos;ils rejoignent
                  votre espace depuis la page de connexion) :
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
                    {entreprise.id}
                  </code>
                  <button
                    onClick={copierCode}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {copie ? "Copié !" : "Copier"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Utilisateurs</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left dark:bg-zinc-800">
              <tr>
                <th className="px-3 py-2">Nom</th>
                <th className="px-3 py-2">Rôle</th>
                {estAdmin && <th className="px-3 py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-3 py-2">{u.nom}</td>
                  <td className="px-3 py-2 capitalize">{u.role}</td>
                  {estAdmin && (
                    <td className="px-3 py-2">
                      {u.id !== profil?.id && (
                        <select
                          value={u.role}
                          onChange={(e) => changerRole(u.id, e.target.value as Role)}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
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
