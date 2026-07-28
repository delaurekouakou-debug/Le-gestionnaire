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
  rafraichirProfil: () => Promise<void>;
  deconnexion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  const chargerProfil = async (userId: string) => {
    const { data } = await supabase
      .from("utilisateurs")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfil(data as Utilisateur | null);
  };

  useEffect(() => {
    let actif = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!actif) return;
      setSession(data.session);
      if (data.session) {
        await chargerProfil(data.session.user.id);
      }
      setChargement(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, nouvelleSession) => {
        setSession(nouvelleSession);
        if (nouvelleSession) {
          await chargerProfil(nouvelleSession.user.id);
        } else {
          setProfil(null);
        }
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
      rafraichirProfil: async () => {
        if (session) await chargerProfil(session.user.id);
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
