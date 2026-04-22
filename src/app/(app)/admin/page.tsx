"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { ShieldCheck, UserCheck, UserX, Clock } from "lucide-react";

type AdminUser = {
  id: string; name: string; email: string;
  role: string; status: string; createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; variant: "warning" | "success" | "danger" | "muted" }> = {
  PENDING:   { label: "Pendente",   variant: "warning" },
  ACTIVE:    { label: "Ativo",      variant: "success" },
  SUSPENDED: { label: "Suspenso",   variant: "danger"  },
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", MANAGER: "Gerente", EDITOR: "Editor", CLIENT: "Cliente",
};

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "ADMIN") { router.push("/dashboard"); return; }
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((j) => setUsers(j.data ?? []))
      .finally(() => setLoading(false));
  }, [user, router]);

  async function updateUser(id: string, patch: { status?: string; role?: string }) {
    setUpdating(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const json = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...json.data } : u)));
    }
    setUpdating(null);
  }

  const pending = users.filter((u) => u.status === "PENDING");
  const others  = users.filter((u) => u.status !== "PENDING");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Administração" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total de usuários", value: users.length, icon: ShieldCheck },
            { label: "Aguardando aprovação", value: pending.length, icon: Clock },
            { label: "Ativos", value: users.filter((u) => u.status === "ACTIVE").length, icon: UserCheck },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6366f1]/15">
                  <Icon className="h-5 w-5 text-[#818cf8]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-[var(--muted-fg)]">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending approvals */}
        {pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-400" />
                Aguardando aprovação ({pending.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg p-3 bg-[var(--surface-2)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6366f1]/20 text-[#818cf8] text-xs font-semibold uppercase">
                      {u.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-[var(--muted-fg)] truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" isLoading={updating === u.id} onClick={() => updateUser(u.id, { status: "ACTIVE" })}>
                      <UserCheck className="h-3.5 w-3.5" />Aprovar
                    </Button>
                    <Button size="sm" variant="danger" isLoading={updating === u.id} onClick={() => updateUser(u.id, { status: "SUSPENDED" })}>
                      <UserX className="h-3.5 w-3.5" />Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* All users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Todos os usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-xs text-[var(--muted-fg)]">Carregando...</p>
            ) : (
              <div className="space-y-1">
                {others.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-[var(--surface-2)]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6366f1]/20 text-[#818cf8] text-xs font-semibold uppercase">
                        {u.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm truncate">{u.name}</p>
                        <p className="text-xs text-[var(--muted-fg)] truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[var(--muted-fg)]">{ROLE_LABELS[u.role] ?? u.role}</span>
                      <Badge variant={STATUS_LABELS[u.status]?.variant ?? "muted"} className="text-[10px]">
                        {STATUS_LABELS[u.status]?.label ?? u.status}
                      </Badge>
                      {u.status === "ACTIVE" && u.role !== "ADMIN" && (
                        <Button size="sm" variant="outline" isLoading={updating === u.id} onClick={() => updateUser(u.id, { status: "SUSPENDED" })}>
                          Suspender
                        </Button>
                      )}
                      {u.status === "SUSPENDED" && (
                        <Button size="sm" variant="outline" isLoading={updating === u.id} onClick={() => updateUser(u.id, { status: "ACTIVE" })}>
                          Reativar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
