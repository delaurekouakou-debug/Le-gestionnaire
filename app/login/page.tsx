"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Boxes, ClipboardList, ShieldCheck, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { MESSAGE_PROFIL_MANQUANT, messageErreurConnexion, obtenirCompte } from "@/lib/authFlows";

type Mode = "connexion" | "rejoindre";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInterne />
    </Suspense>
  );
}

function LoginPageInterne() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { appliquerSession } = useAuth();

  const [mode, setMode] = useState<Mode>("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nom, setNom] = useState("");
  const [codeEntreprise, setCodeEntreprise] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    searchParams.get("raison") === "profil_manquant" ? MESSAGE_PROFIL_MANQUANT : null
  );
  const [chargement, setChargement] = useState(false);

  const allerAuTableauDeBord = () => {
    // Pas de router.refresh() ici : ce site est un export statique sans
    // serveur, donc rien à "rafraîchir" côté serveur — cet appel provoquait
    // une navigation fantôme qui ramenait sur /login juste après l'arrivée
    // sur /dashboard.
    router.push("/dashboard/");
  };

  const gererConnexion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setInfo(null);
    setChargement(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });
    if (error) {
      setChargement(false);
      setErreur(messageErreurConnexion(error.message));
      return;
    }

    // On attend que le profil soit chargé dans le contexte avant de
    // naviguer : se fier au seul événement onAuthStateChange (asynchrone,
    // minutage non garanti) pouvait faire arriver sur /dashboard avant que
    // la session y soit visible, ce qui renvoyait aussitôt vers /login.
    const profilCharge = await appliquerSession(data.session);
    setChargement(false);

    if (!profilCharge) {
      await supabase.auth.signOut();
      setInfo(MESSAGE_PROFIL_MANQUANT);
      return;
    }

    allerAuTableauDeBord();
  };

  const gererRejoindre = async (e: React.FormEvent) => {
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
        "Compte créé. Ce projet Supabase exige une confirmation par email : vérifiez votre boîte de réception, cliquez sur le lien reçu, puis revenez sur « Rejoindre » avec les mêmes identifiants pour terminer l'inscription."
      );
      return;
    }

    const { session, userId } = resultat;

    const profilExistant = await appliquerSession(session);
    if (profilExistant) {
      setChargement(false);
      allerAuTableauDeBord();
      return;
    }

    const { error: profilError } = await supabase.from("utilisateurs").insert({
      id: userId,
      entreprise_id: codeEntreprise.trim(),
      nom,
      role: "employe",
    });
    if (profilError) {
      setChargement(false);
      setErreur(
        "Impossible de rejoindre l'entreprise. Vérifiez le code fourni par votre administrateur : " +
          profilError.message
      );
      return;
    }

    const profilCharge = await appliquerSession(session);
    setChargement(false);
    if (!profilCharge) {
      setErreur("Le profil vient d'être créé mais n'a pas pu être chargé. Réessayez de vous connecter.");
      return;
    }

    allerAuTableauDeBord();
  };

  const gererSoumission = mode === "connexion" ? gererConnexion : gererRejoindre;

  const champClasse =
    "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div className="flex flex-1">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-navy-950 px-10 py-10 text-navy-200 lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Boxes className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="text-lg font-bold text-white">Le Gestionnaire</span>
        </div>

        <div className="max-w-sm">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Le poste de contrôle de votre stock.
          </h1>
          <p className="mt-3 text-sm text-navy-200">
            Suivez vos entrées, sorties et alertes de rupture en temps réel, sur
            un seul écran pensé pour l&apos;opérationnel.
          </p>

          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} />
              Traçabilité complète des mouvements de stock
            </li>
            <li className="flex items-start gap-3">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} />
              Tableau de bord avec alertes de réapprovisionnement
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} />
              Données isolées et sécurisées par entreprise
            </li>
          </ul>
        </div>

        <p className="text-xs text-navy-400">© {new Date().getFullYear()} Le Gestionnaire</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center lg:hidden">
            <div className="mb-2 flex justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
                <Boxes className="h-5 w-5" strokeWidth={2.25} />
              </span>
            </div>
            <h1 className="text-2xl font-bold text-chart-ink">Le Gestionnaire</h1>
            <p className="mt-1 text-sm text-chart-muted">Gestion de stock pour PME</p>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-xl font-bold text-chart-ink">Bienvenue</h2>
            <p className="mt-1 text-sm text-chart-muted">Connectez-vous à votre espace</p>
          </div>

          {info && (
            <p className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {info}
            </p>
          )}

          <div className="flex rounded-lg border border-zinc-200 p-1 text-sm dark:border-zinc-800">
            {(
              [
                ["connexion", "Connexion"],
                ["rejoindre", "Rejoindre une entreprise"],
              ] as [Mode, string][]
            ).map(([valeur, libelle]) => (
              <button
                key={valeur}
                type="button"
                onClick={() => {
                  setMode(valeur);
                  setErreur(null);
                  setInfo(null);
                }}
                className={`flex-1 whitespace-nowrap rounded-md px-1.5 py-1.5 text-xs transition sm:text-sm ${
                  mode === valeur
                    ? "bg-brand-600 text-white"
                    : "text-chart-muted hover:text-chart-ink"
                }`}
              >
                {libelle}
              </button>
            ))}
          </div>

          <form onSubmit={gererSoumission} className="space-y-4">
            {mode === "rejoindre" && (
              <>
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
                  <label className="block text-sm font-medium text-chart-ink">Code entreprise</label>
                  <input
                    type="text"
                    required
                    placeholder="Fourni par votre administrateur"
                    value={codeEntreprise}
                    onChange={(e) => setCodeEntreprise(e.target.value)}
                    className={champClasse}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-chart-ink">Email</label>
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

            {erreur && (
              <p className="rounded-md bg-critical/10 px-3 py-2 text-sm text-critical">{erreur}</p>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {chargement
                ? "Veuillez patienter…"
                : mode === "connexion"
                  ? "Se connecter"
                  : "Rejoindre l'entreprise"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
