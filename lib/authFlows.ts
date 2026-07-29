import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export function messageErreurConnexion(message: string | undefined): string {
  if (!message) return "Identifiants invalides. Vérifiez votre email et mot de passe.";
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Cet email n'a pas encore été confirmé. Vérifiez votre boîte de réception (et les spams) pour le lien de confirmation envoyé par Supabase.";
  }
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Identifiants invalides. Vérifiez votre email et mot de passe.";
  }
  return message;
}

export function messageErreurInscription(message: string | undefined): string {
  if (!message) return "Impossible de créer le compte.";
  if (message.toLowerCase().includes("email rate limit exceeded")) {
    return "Trop de tentatives d'inscription en peu de temps : Supabase limite l'envoi d'emails de confirmation sur le plan gratuit. Réessayez dans quelques minutes, ou désactivez « Confirm email » dans Authentication → Providers → Email sur le dashboard Supabase pour ne plus en dépendre.";
  }
  if (message.toLowerCase().includes("user already registered")) {
    return "Un compte existe déjà avec cet email. Utilisez plutôt l'onglet « Connexion », ou réinitialisez le mot de passe si besoin.";
  }
  return message;
}

export const MESSAGE_PROFIL_MANQUANT =
  "Ce compte existe mais n'est associé à aucune entreprise (une inscription précédente a probablement été interrompue avant la fin). Recommencez avec « Rejoindre », ou contactez votre administrateur.";

export type ResultatCompte =
  | { type: "ok"; session: Session; userId: string }
  | { type: "confirmation_requise" }
  | { type: "erreur"; message: string };

// Crée le compte, ou — s'il existe déjà (ex : une précédente tentative a été
// interrompue après le signUp mais avant la création du profil) — se
// connecte directement avec les mêmes identifiants pour reprendre
// l'inscription là où elle s'était arrêtée. Sans ça, un compte dans cet état
// reste bloqué entre "déjà enregistré" au signUp et "pas de profil" à la
// connexion, sans issue.
export async function obtenirCompte(email: string, motDePasse: string): Promise<ResultatCompte> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: motDePasse,
  });

  if (authError?.message?.toLowerCase().includes("user already registered")) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });
    if (signInError || !signInData.session || !signInData.user) {
      return {
        type: "erreur",
        message:
          "Un compte existe déjà avec cet email, mais le mot de passe saisi ne correspond pas à celui utilisé précédemment. Utilisez l'onglet « Connexion » avec le bon mot de passe, ou contactez votre administrateur.",
      };
    }
    return { type: "ok", session: signInData.session, userId: signInData.user.id };
  }

  if (authError || !authData.user) {
    return { type: "erreur", message: messageErreurInscription(authError?.message) };
  }

  if (!authData.session) {
    return { type: "confirmation_requise" };
  }

  return { type: "ok", session: authData.session, userId: authData.user.id };
}
