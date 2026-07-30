"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Boxes, ClipboardList, ShieldCheck, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { MESSAGE_PROFIL_MANQUANT, identifiantVersEmail, messageErreurConnexion } from "@/lib/authFlows";
import ChampMotDePasse from "@/components/ChampMotDePasse";

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

  const [modeRecuperation, setModeRecuperation] = useState(false);
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    searchParams.get("raison") === "profil_manquant" ? MESSAGE_PROFIL_MANQUANT : null
  );
  const [chargement, setChargement] = useState(false);

  const basculerRecuperation = (valeur: boolean) => {
    setModeRecuperation(valeur);
    setErreur(null);
    setInfo(null);
  };

  const gererConnexion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifiantVersEmail(identifiant),
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
      setErreur(MESSAGE_PROFIL_MANQUANT);
      return;
    }

    // Pas de router.refresh() ici : ce site est un export statique sans
    // serveur, donc rien à "rafraîchir" côté serveur — cet appel provoquait
    // une navigation fantôme qui ramenait sur /login juste après l'arrivée
    // sur /dashboard.
    router.push("/dashboard/");
  };

  const gererRecuperation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setInfo(null);
    setChargement(true);

    // La redirection est calculée à partir de l'URL courante plutôt que
    // codée en dur, pour fonctionner aussi bien en local (basePath vide)
    // que sur GitHub Pages (basePath /Le-gestionnaire).
    const racine = window.location.origin + window.location.pathname.replace(/\/login\/?$/, "");
    await supabase.auth.resetPasswordForEmail(identifiantVersEmail(identifiant), {
      redirectTo: `${racine}/reinitialiser-mot-de-passe/`,
    });

    setChargement(false);
    // Message volontairement identique que le compte existe ou non (et
    // qu'il s'agisse d'une vraie adresse email ou d'un compte créé sans
    // email par un administrateur) : ça évite de révéler quels identifiants
    // sont valides.
    setInfo(
      "Si ce compte dispose d'une adresse email valide, un lien de réinitialisation vient de lui être envoyé. Si votre compte a été créé par un administrateur avec un simple identifiant (sans email), demandez-lui de vous en définir un nouveau depuis Paramètres."
    );
  };

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
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-chart-ink">Le Gestionnaire</h1>
            <p className="mt-1 text-sm text-chart-muted">Gestion de stock pour PME</p>
          </div>

          <div className="hidden lg:block">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-chart-ink">
              {modeRecuperation ? "Mot de passe oublié" : "Bienvenue"}
            </h2>
            <p className="mt-1 text-sm text-chart-muted">
              {modeRecuperation
                ? "Recevez un lien pour définir un nouveau mot de passe"
                : "Connectez-vous à votre espace"}
            </p>
          </div>

          {info && (
            <p className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {info}
            </p>
          )}

          {!modeRecuperation ? (
            <form onSubmit={gererConnexion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-chart-ink">Identifiant</label>
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={identifiant}
                  onChange={(e) => setIdentifiant(e.target.value)}
                  className={champClasse}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-chart-ink">Mot de passe</label>
                <ChampMotDePasse
                  required
                  autoComplete="current-password"
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
                {chargement ? "Connexion…" : "Se connecter"}
              </button>

              <button
                type="button"
                onClick={() => basculerRecuperation(true)}
                className="w-full text-center text-xs text-chart-muted hover:text-brand-600 hover:underline"
              >
                Mot de passe oublié ?
              </button>

              <p className="text-center text-xs text-chart-muted">
                Pas encore de compte ? Votre administrateur peut en créer un pour vous
                depuis les paramètres de l&apos;entreprise.
              </p>
            </form>
          ) : (
            <form onSubmit={gererRecuperation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-chart-ink">Identifiant</label>
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={identifiant}
                  onChange={(e) => setIdentifiant(e.target.value)}
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
                {chargement ? "Envoi…" : "Envoyer le lien de réinitialisation"}
              </button>

              <button
                type="button"
                onClick={() => basculerRecuperation(false)}
                className="w-full text-center text-xs text-chart-muted hover:text-brand-600 hover:underline"
              >
                Retour à la connexion
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
