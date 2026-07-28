"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, profil, chargement } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!chargement && !session) {
      router.replace("/login");
    }
  }, [chargement, session, router]);

  if (chargement || !session || !profil) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Chargement…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
