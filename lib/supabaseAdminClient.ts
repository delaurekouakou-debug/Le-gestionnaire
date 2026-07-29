import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client isolé, sans persistance de session : utilisé uniquement pour créer
// le compte "auth" d'un nouveau membre depuis l'écran d'un administrateur
// déjà connecté. `persistSession: false` l'empêche d'écrire dans le
// localStorage partagé, donc il ne peut jamais écraser la session de
// l'administrateur portée par le client principal (lib/supabaseClient.ts).
// Une nouvelle instance par appel : rien à réinitialiser après usage.
export function creerClientIsole() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
