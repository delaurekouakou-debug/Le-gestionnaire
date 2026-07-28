"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { Utilisateur } from "./types";

interface AuthContextValue {
  session: Session | null;
  profil: Utilisateur | null;
  chargement: boolean;
  // Met à jour session + profil de façon synchrone/awaitable et renvoie le
  // profil chargé (ou null). À utiliser juste après un signIn/signUp
  // réussi : on ne peut pas se fier au seul minutage de onAuthStateChange
  // pour savoir quand il est sûr de naviguer vers une page protégée.
  appliquerSession: (session: Session | null) => Promise<Utilisateur | null>;
  rafraichirProfil: () => Promise<void>;
  deconnexion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function recupererProfil(userId: string): Promise<Utilisateur | null> {
  const { data } = await supabase
    .from("utilisateurs")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (data as Utilisateur | null) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  const appliquerSession = async (nouvelleSession: Session | null) => {
    setSession(nouvelleSession);
    if (!nouvelleSession) {
      setProfil(null);
      return null;
    }
    const profilCharge = await recupererProfil(nouvelleSession.user.id);
    setProfil(profilCharge);
    return profilCharge;
  };

  useEffect(() => {
    let actif = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!actif) return;
      await appliquerSession(data.session);
      if (actif) setChargement(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, nouvelleSession) => {
        if (!actif) return;
        await appliquerSession(nouvelleSession);
      }
    );

    return () => {
      actif = false;
      subscription.subscription.unsubscribe();
    };
     
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profil,
      chargement,
      appliquerSession,
      rafraichirProfil: async () => {
        if (session) await appliquerSession(session);
      },
      deconnexion: async () => {
        await supabase.auth.signOut();
      },
    }),
     
    [session, profil, chargement]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
