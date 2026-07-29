"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { obtenirCompte } from "@/lib/authFlows";

const champClasse =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900";

export default function CreerEntreprisePage() {
  const router = useRouter();
  const { appliquerSession } = useAuth();

  const [codeMaitre, setCodeMaitre] = useState("");
  const [codeValide, setCodeValide] = useState(false);
  const [nom, setNom] = useState("");
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const gererVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const { data, error } = await supabase.rpc("verifier_code_maitre", { code: codeMaitre });

    setChargement(false);
    if (error) {
      setErreur(
        "Erreur technique lors de la vérification du code : " +
          error.message +
          ". Vérifiez que supabase/repair_policies.sql a bien été exécuté sans erreur."
      );
      return;
    }
    if (data !== true) {
      setErreur("Code invalide.");
      return;
    }
    setCodeValide(true);
  };

  const gererCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setInfo(null);
    setChargement(true);

    const resultat = await obtenirCompte(email, motDePasse);

    if (resultat.type === "erreur") {
      setChargement(false);
      setErreur(resultat.message);
      return;
    }
    if (resultat.type === "confirmation_requise") {
      setChargement(false);
      setInfo(
        "Compte créé. Ce projet Supabase exige une confirmation par email : vérifiez votre boîte de réception, cliquez sur le lien reçu, puis revenez ici avec les mêmes identifiants pour terminer la création."
      );
      return;
    }

    const { session, userId } = resultat;

    // Le compte pouvait déjà avoir un profil (ex : la création avait en fait
    // abouti lors d'une tentative précédente malgré une coupure juste après)
    // — dans ce cas on se contente de se connecter, sans recréer d'entreprise.
    const profilExistant = await appliquerSession(session);
    if (profilExistant) {
      setChargement(false);
      router.push("/dashboard/");
      return;
    }

    const { data: entrepriseId, error: entrepriseError } = await supabase.rpc(
      "creer_entreprise_admin",
      { nom_entreprise: nomEntreprise, code_maitre: codeMaitre }
    );
    if (entrepriseError || !entrepriseId) {
      setChargement(false);
      setErreur(
        "Compte prêt mais impossible de créer l'entreprise : " +
          (entrepriseError?.message ?? "erreur inconnue")
      );
      return;
    }

    const { error: profilError } = await supabase.from("utilisateurs").insert({
      id: userId,
      entreprise_id: entrepriseId,
      nom,
      role: "admin",
    });
    if (profilError) {
      setChargement(false);
      setErreur("Entreprise créée mais impossible de créer le profil : " + profilError.message);
      return;
    }

    const profilCharge = await appliquerSession(session);
    setChargement(false);
    if (!profilCharge) {
      setErreur("Le profil vient d'être créé mais n'a pas pu être chargé. Réessayez de vous connecter.");
      return;
    }

    router.push("/dashboard/");
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mb-2 flex justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-950 text-white">
              <Boxes className="h-5 w-5" strokeWidth={2.25} />
            </span>
          </div>
          <h1 className="text-xl font-bold text-chart-ink">Créer une entreprise</h1>
          <p className="mt-1 text-sm text-chart-muted">Accès réservé — code requis</p>
        </div>

        {!codeValide ? (
          <form onSubmit={gererVerificationCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-chart-ink">Code maître</label>
              <div className="relative mt-1">
                <KeyRound
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-chart-muted"
                  strokeWidth={2}
                />
                <input
                  type="password"
                  required
                  autoFocus
                  value={codeMaitre}
                  onChange={(e) => setCodeMaitre(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </div>

            {erreur && (
              <p className="rounded-md bg-critical/10 px-3 py-2 text-sm text-critical">{erreur}</p>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="w-full rounded-md bg-navy-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-navy-900 disabled:opacity-50"
            >
              {chargement ? "Vérification…" : "Continuer"}
            </button>
          </form>
        ) : (
          <form onSubmit={gererCreation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-chart-ink">Votre nom</label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className={champClasse}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-chart-ink">Nom de l&apos;entreprise</label>
              <input
                type="text"
                required
                value={nomEntreprise}
                onChange={(e) => setNomEntreprise(e.target.value)}
                className={champClasse}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-chart-ink">Email de l&apos;administrateur</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={champClasse}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-chart-ink">Mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className={champClasse}
              />
            </div>

            {info && (
              <p className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {info}
              </p>
            )}
            {erreur && (
              <p className="rounded-md bg-critical/10 px-3 py-2 text-sm text-critical">{erreur}</p>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {chargement ? "Création…" : "Créer l'entreprise"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
