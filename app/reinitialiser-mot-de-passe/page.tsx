"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import ChampMotDePasse from "@/components/ChampMotDePasse";

const champClasse =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900";

// Le lien de réinitialisation envoyé par Supabase contient un jeton dans le
// fragment d'URL (#access_token=...&type=recovery) que le client détecte
// automatiquement (detectSessionInUrl, activé par défaut) et transforme en
// session active. On vérifie donc simplement qu'une session existe.
export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const [pret, setPret] = useState<boolean | null>(null);
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    let actif = true;

    const verifier = async () => {
      const { data } = await supabase.auth.getSession();
      if (actif) setPret(!!data.session);
    };
    verifier();

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") verifier();
    });

    return () => {
      actif = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const gererSoumission = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (nouveauMotDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);
    const { error } = await supabase.auth.updateUser({ password: nouveauMotDePasse });
    setChargement(false);

    if (error) {
      setErreur("Impossible de mettre à jour le mot de passe : " + error.message);
      return;
    }

    setSucces(true);
    await supabase.auth.signOut();
    setTimeout(() => router.push("/login/"), 2000);
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
          <h1 className="text-xl font-bold text-chart-ink">Nouveau mot de passe</h1>
        </div>

        {pret === null && <p className="text-center text-sm text-chart-muted">Vérification du lien…</p>}

        {pret === false && (
          <p className="rounded-md bg-critical/10 px-3 py-2 text-sm text-critical">
            Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau depuis la page
            de connexion, ou faites réinitialiser votre mot de passe par votre administrateur.
          </p>
        )}

        {pret === true && succes && (
          <p className="rounded-md bg-good/10 px-3 py-2 text-sm text-good">
            Mot de passe mis à jour. Redirection vers la connexion…
          </p>
        )}

        {pret === true && !succes && (
          <form onSubmit={gererSoumission} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-chart-ink">Nouveau mot de passe</label>
              <ChampMotDePasse
                required
                minLength={6}
                autoComplete="new-password"
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                className={champClasse}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-chart-ink">Confirmer le mot de passe</label>
              <ChampMotDePasse
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className={champClasse}
              />
            </div>

            {erreur && (
              <p className="rounded-md bg-critical/10 px-3 py-2 text-sm text-critical">{erreur}</p>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {chargement ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
