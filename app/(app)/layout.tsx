"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Sidebar from "@/components/Sidebar";

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
      <div className="flex flex-1 items-center justify-center bg-chart-plane text-sm text-chart-muted">
        Chargement…
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-chart-plane">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-auto px-6 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
