"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/store/auth";

function PendingScreen() {
  const { logout } = useAuthStore();
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background)]">
      <div className="text-center space-y-4 max-w-sm px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f97316]/15 text-[#fb923c] text-2xl font-bold mx-auto">K</div>
        <h2 className="text-xl font-semibold">Aguardando aprovação</h2>
        <p className="text-sm text-[var(--muted-fg)]">
          Sua conta foi criada com sucesso. O administrador precisa aprovar seu acesso antes de você entrar no sistema.
        </p>
        <button
          onClick={logout}
          className="text-sm text-[#fb923c] hover:underline"
        >
          Sair e usar outra conta
        </button>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user) return null;
  if (user.status === "PENDING" || user.status === "SUSPENDED") return <PendingScreen />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
        {children}
      </main>
    </div>
  );
}
