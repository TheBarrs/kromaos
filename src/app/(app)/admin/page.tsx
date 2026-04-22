"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { ShieldCheck, UserCheck, UserX, Clock, Users } from "lucide-react";

type AdminUser = {
  id: string; name: string; email: string;
  role: string; status: string; createdAt: string;
};


const ROLES = [
  { value: "EQUIPE",  label: "Equipe",  desc: "Acesso a tudo, exceto Financeiro" },
  { value: "CLIENTE", label: "Cliente", desc: "Acesso apenas a Pipeline e Aprovações" },
  { value: "ADMIN",   label: "Admin",   desc: "Acesso total" },
];

const ROLE_LABELS: Record<string, string> = { ADMIN: "Admin", EQUIPE: "Equipe", CLIENTE: "Cliente" };

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && user.role !== "ADMIN") { router.push("/dashboard"); return; }
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((j) => {
        const list: AdminUser[] = j.data ?? [];
        setUsers(list);
        const defaults: Record<string, string> = {};
        list.forEach((u) => { defaults[u.id] = u.role === "ADMIN" ? "EQUIPE" : u.role; });
        setPendingRoles(defaults);
      })
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

  async function approveUser(u: AdminUser) {
    const role = pendingRoles[u.id] ?? "EQUIPE";
    await updateUser(u.id, { status: "ACTIVE", role });
  }

  const pending = users.filter((u) => u.status === "PENDING");
  const active  = users.filter((u) => u.status === "ACTIVE");
  const others  = users.filter((u) => u.status === "SUSPENDED");

  if (loading) return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Administração" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--muted-fg)]">Carregando...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Administração" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total de usuários", value: users.length, icon: Users },
            { label: "Aguardando aprovação", value: pending.length, icon: Clock },
            { label: "Ativos", value: active.length, icon: UserCheck },
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

        {/* Pending */}
        {pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-400" />
                Aguardando aprovação ({pending.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.map((u) => (
                <div key={u.id} className="rounded-lg border border-[var(--border)] p-4 space-y-3">
                  {/* User info */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6366f1]/20 text-[#818cf8] text-sm font-semibold uppercase">
                      {u.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-[var(--muted-fg)]">{u.email}</p>
                    </div>
                  </div>

                  {/* Role selector */}
                  <div>
                    <p className="text-xs text-[var(--muted-fg)] mb-2">Escolha a função:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setPendingRoles((p) => ({ ...p, [u.id]: r.value }))}
                          className={`rounded-lg border p-2.5 text-left transition-colors ${
                            (pendingRoles[u.id] ?? "EQUIPE") === r.value
                              ? "border-[#6366f1] bg-[#6366f1]/10 text-[#818cf8]"
                              : "border-[var(--border)] hover:bg-[var(--surface-2)]"
                          }`}
                        >
                          <p className="text-xs font-semibold">{r.label}</p>
                          <p className="text-[10px] text-[var(--muted-fg)] mt-0.5">{r.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" isLoading={updating === u.id} onClick={() => approveUser(u)}>
                      <UserCheck className="h-3.5 w-3.5" />
                      Aprovar como {ROLE_LABELS[pendingRoles[u.id] ?? "EQUIPE"]}
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

        {/* Active users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-[#6366f1]" />
              Usuários ativos ({active.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {active.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-[var(--surface-2)]">
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
                  {/* Role change dropdown */}
                  {u.role !== "ADMIN" && (
                    <select
                      value={u.role}
                      onChange={(e) => updateUser(u.id, { role: e.target.value })}
                      disabled={updating === u.id}
                      className="text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                    >
                      <option value="EQUIPE">Equipe</option>
                      <option value="CLIENTE">Cliente</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  )}
                  <Badge variant={u.role === "ADMIN" ? "default" : "muted"} className="text-[10px]">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </Badge>
                  {u.role !== "ADMIN" && (
                    <Button size="sm" variant="outline" isLoading={updating === u.id} onClick={() => updateUser(u.id, { status: "SUSPENDED" })}>
                      Suspender
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Suspended */}
        {others.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <UserX className="h-4 w-4 text-red-400" />
                Suspensos ({others.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {others.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-[var(--surface-2)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-xs font-semibold uppercase">
                      {u.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate">{u.name}</p>
                      <p className="text-xs text-[var(--muted-fg)] truncate">{u.email}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" isLoading={updating === u.id} onClick={() => updateUser(u.id, { status: "ACTIVE" })}>
                    Reativar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
