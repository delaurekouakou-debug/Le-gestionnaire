"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { session, profil, chargement } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (chargement) return;
    router.replace(session && profil ? "/dashboard" : "/login");
  }, [chargement, session, profil, router]);

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
      Chargement…
    </div>
  );
}
